'use client'

import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cancionero_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading favorites', e);
      }
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id];
      localStorage.setItem('cancionero_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite };
}
