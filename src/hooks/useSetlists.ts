'use client'

import { useState, useEffect } from 'react';

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  isPublic?: boolean;
}

export function useSetlists() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cancionero_setlists');
    if (saved) {
      try {
        setSetlists(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading setlists', e);
      }
    }
  }, []);

  const saveSetlists = (newSetlists: Setlist[]) => {
    setSetlists(newSetlists);
    localStorage.setItem('cancionero_setlists', JSON.stringify(newSetlists));
  };

  const createSetlist = (name: string) => {
    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name,
      songIds: [],
    };
    saveSetlists([...setlists, newSetlist]);
    return newSetlist;
  };

  const deleteSetlist = (id: string) => {
    saveSetlists(setlists.filter(s => s.id !== id));
  };

  const addSongToSetlist = (setlistId: string, songId: string) => {
    saveSetlists(setlists.map(s => {
      if (s.id === setlistId && !s.songIds.includes(songId)) {
        return { ...s, songIds: [...s.songIds, songId] };
      }
      return s;
    }));
  };

  const removeSongFromSetlist = (setlistId: string, songId: string) => {
    saveSetlists(setlists.map(s => {
      if (s.id === setlistId) {
        return { ...s, songIds: s.songIds.filter(id => id !== songId) };
      }
      return s;
    }));
  };

  const toggleSetlistPublic = (setlistId: string) => {
    saveSetlists(setlists.map(s => {
      if (s.id === setlistId) {
        return { ...s, isPublic: !s.isPublic };
      }
      return s;
    }));
  };

  const moveSongInSetlist = (setlistId: string, songId: string, direction: 'up' | 'down') => {
    saveSetlists(setlists.map(s => {
      if (s.id === setlistId) {
        const index = s.songIds.indexOf(songId);
        if (index === -1) return s;
        if (direction === 'up' && index === 0) return s;
        if (direction === 'down' && index === s.songIds.length - 1) return s;

        const newSongIds = [...s.songIds];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [newSongIds[index], newSongIds[newIndex]] = [newSongIds[newIndex], newSongIds[index]];
        
        return { ...s, songIds: newSongIds };
      }
      return s;
    }));
  };

  return { setlists, createSetlist, deleteSetlist, addSongToSetlist, removeSongFromSetlist, moveSongInSetlist, toggleSetlistPublic };
}
