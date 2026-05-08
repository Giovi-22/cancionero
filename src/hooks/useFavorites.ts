'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

export function useFavorites() {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Cargar favoritos iniciales (Local -> Nube)
  useEffect(() => {
    const loadFavorites = async () => {
      // Cargar de sessionStorage primero
      const saved = sessionStorage.getItem('cancionero_favorites');
      let localFavs: string[] = [];
      if (saved) {
        try { localFavs = JSON.parse(saved); } catch (e) {}
      }
      setFavorites(localFavs);

      // Si hay sesión, intentar sincronizar con Supabase
      if (session?.user?.email) {
        console.log('Sincronizando favoritos con Supabase para:', session.user.email);
        setIsSyncing(true);
        const { data, error } = await supabase
          .from('favorites')
          .select('song_id')
          .eq('user_email', session.user.email);

        if (error) {
          console.error('Error al descargar favoritos de Supabase:', error.message, error.details);
        }

        if (!error && data) {
          const cloudFavs = data.map(f => f.song_id);
          console.log('Favoritos en la nube:', cloudFavs);
          
          // Migración simple: si hay locales que no están en la nube, subirlos
          const merged = Array.from(new Set([...localFavs, ...cloudFavs]));
          
          if (localFavs.some(f => !cloudFavs.includes(f))) {
            console.log('Migrando favoritos locales a la nube...');
            const toInsert = merged.map(id => ({ 
              user_email: session.user?.email, 
              song_id: id 
            }));
            const { error: upsertError } = await supabase.from('favorites').upsert(toInsert, { onConflict: 'user_email,song_id' });
            if (upsertError) console.error('Error al subir favoritos locales:', upsertError);
          }
          
          setFavorites(merged);
          sessionStorage.setItem('cancionero_favorites', JSON.stringify(merged));
        }
        setIsSyncing(false);
      } else {
        console.log('No hay sesión activa para sincronizar favoritos.');
      }
    };

    loadFavorites();
  }, [session]);

  const toggleFavorite = async (id: string) => {
    const isFav = favorites.includes(id);
    const newFavorites = isFav
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    
    // Actualización optimista del estado local
    setFavorites(newFavorites);
    sessionStorage.setItem('cancionero_favorites', JSON.stringify(newFavorites));

    // Si hay sesión, actualizar en la nube
    if (session?.user?.email) {
      console.log(`${isFav ? 'Eliminando' : 'Agregando'} favorito en Supabase:`, id);
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_email: session.user.email, song_id: id });
        if (error) console.error('Error al eliminar favorito de Supabase:', error);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_email: session.user.email, song_id: id });
        if (error) console.error('Error al insertar favorito en Supabase:', error);
      }
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite, isSyncing };
}
