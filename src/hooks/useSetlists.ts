'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  isPublic?: boolean;
}

export function useSetlists() {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Cargar setlists iniciales (Local -> Nube)
  useEffect(() => {
    const loadSetlists = async () => {
      const saved = sessionStorage.getItem('cancionero_setlists');
      let localSets: Setlist[] = [];
      if (saved) {
        try { localSets = JSON.parse(saved); } catch (e) {}
      }
      setSetlists(localSets);

      if (session?.user?.email) {
        setIsSyncing(true);
        const { data, error } = await supabase
          .from('setlists')
          .select('*')
          .eq('user_email', session.user.email);

        if (!error && data) {
          const cloudSets: Setlist[] = data.map(s => ({
            id: s.id,
            name: s.name,
            songIds: s.song_ids,
            isPublic: s.is_public
          }));

          // Migración: si hay locales, los subimos (si no están ya en la nube por nombre o algo)
          // Para simplificar, priorizamos la nube pero agregamos locales que no existan
          const merged = [...cloudSets];
          for (const local of localSets) {
            if (!cloudSets.find(cs => cs.name === local.name)) {
              const { data: newS, error: err } = await supabase
                .from('setlists')
                .insert({
                  user_email: session.user.email,
                  name: local.name,
                  song_ids: local.songIds,
                  is_public: !!local.isPublic
                })
                .select()
                .single();
              
              if (newS) {
                merged.push({
                  id: newS.id,
                  name: newS.name,
                  songIds: newS.song_ids,
                  isPublic: newS.is_public
                });
              }
            }
          }

          setSetlists(merged);
          sessionStorage.setItem('cancionero_setlists', JSON.stringify(merged));
        }
        setIsSyncing(false);
      }
    };

    loadSetlists();
  }, [session]);

  const saveSetlistToCloud = async (set: Setlist) => {
    if (!session?.user?.email) return;
    
    // Si el ID es numérico (temporal local), insertamos. Si es UUID, actualizamos.
    const isLocalId = !set.id.includes('-'); 
    
    if (isLocalId) {
      const { data } = await supabase
        .from('setlists')
        .insert({
          user_email: session.user.email,
          name: set.name,
          song_ids: set.songIds,
          is_public: !!set.isPublic
        })
        .select()
        .single();
      
      if (data) {
        // Actualizamos el estado local con el ID real de Supabase
        setSetlists(prev => prev.map(s => s.name === set.name ? { ...s, id: data.id } : s));
      }
    } else {
      await supabase
        .from('setlists')
        .update({
          name: set.name,
          song_ids: set.songIds,
          is_public: !!set.isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', set.id);
    }
  };

  const createSetlist = async (name: string) => {
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name,
      songIds: [],
    };
    
    const newList = [...setlists, newSetlist];
    setSetlists(newList);
    sessionStorage.setItem('cancionero_setlists', JSON.stringify(newList));
    
    if (session?.user?.email) {
      await saveSetlistToCloud(newSetlist);
    }
    return newSetlist;
  };

  const deleteSetlist = async (id: string) => {
    const newList = setlists.filter(s => s.id !== id);
    setSetlists(newList);
    sessionStorage.setItem('cancionero_setlists', JSON.stringify(newList));

    if (session?.user?.email && id.includes('-')) {
      await supabase.from('setlists').delete().eq('id', id);
    }
  };

  const updateSetlist = (setlistId: string, updates: Partial<Setlist>) => {
    const newList = setlists.map(s => {
      if (s.id === setlistId) {
        const updated = { ...s, ...updates };
        if (session?.user?.email) saveSetlistToCloud(updated);
        return updated;
      }
      return s;
    });
    setSetlists(newList);
    sessionStorage.setItem('cancionero_setlists', JSON.stringify(newList));
  };

  const addSongToSetlist = (setlistId: string, songId: string) => {
    const set = setlists.find(s => s.id === setlistId);
    if (set && !set.songIds.includes(songId)) {
      updateSetlist(setlistId, { songIds: [...set.songIds, songId] });
    }
  };

  const removeSongFromSetlist = (setlistId: string, songId: string) => {
    const set = setlists.find(s => s.id === setlistId);
    if (set) {
      updateSetlist(setlistId, { songIds: set.songIds.filter(id => id !== songId) });
    }
  };

  const toggleSetlistPublic = (setlistId: string) => {
    const set = setlists.find(s => s.id === setlistId);
    if (set) {
      updateSetlist(setlistId, { isPublic: !set.isPublic });
    }
  };

  const moveSongInSetlist = (setlistId: string, songId: string, direction: 'up' | 'down') => {
    const set = setlists.find(s => s.id === setlistId);
    if (!set) return;

    const index = set.songIds.indexOf(songId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === set.songIds.length - 1) return;

    const newSongIds = [...set.songIds];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSongIds[index], newSongIds[newIndex]] = [newSongIds[newIndex], newSongIds[index]];
    
    updateSetlist(setlistId, { songIds: newSongIds });
  };

  const syncCurrentSong = async (setlistId: string, songId: string | null) => {
    if (!session?.user?.email) return;
    await supabase
      .from('setlists')
      .update({ current_song_id: songId })
      .eq('id', setlistId);
  };

  const subscribeToSetlist = (setlistId: string, onSongChange: (songId: string) => void) => {
    const channel = supabase
      .channel(`setlist_sync_${setlistId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlists',
          filter: `id=eq.${setlistId}`,
        },
        (payload) => {
          if (payload.new && payload.new.current_song_id) {
            onSongChange(payload.new.current_song_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { 
    setlists, 
    createSetlist, 
    deleteSetlist, 
    addSongToSetlist, 
    removeSongFromSetlist, 
    moveSongInSetlist, 
    toggleSetlistPublic,
    syncCurrentSong,
    subscribeToSetlist,
    isSyncing 
  };
}
