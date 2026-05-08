'use client'

import { useState } from 'react'
import { Song } from '@/types/drive'
import { useSetlists } from '@/hooks/useSetlists'
import Link from 'next/link'

interface HomeSetlistCarouselProps {
  allSongs: Song[]
}

export default function HomeSetlistCarousel({ allSongs }: HomeSetlistCarouselProps) {
  const { setlists } = useSetlists()
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)

  // Si no hay set seleccionado, usamos el primero que tenga canciones
  const currentSetId = selectedSetId || setlists.find(s => s.songIds.length > 0)?.id || (setlists.length > 0 ? setlists[0].id : null)
  const currentSet = setlists.find(s => s.id === currentSetId)
  
  const carouselSongs = currentSet 
    ? currentSet.songIds
        .map(id => allSongs.find(song => song.id === id))
        .filter((song): song is Song => !!song)
    : allSongs.slice(0, 6) // Fallback a las primeras 6 si no hay setlists

  if (setlists.length === 0 && allSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 rounded-3xl bg-muted/20 border border-dashed border-muted">
        <p className="text-muted-foreground text-center mb-6 max-w-xs">
          Inicia sesión para ver tu repertorio personalizado y listas de temas aquí.
        </p>
        <Link 
          href="/songs"
          className="bg-accent/10 text-accent px-6 py-2 rounded-full font-bold hover:bg-accent hover:text-white transition-all"
        >
          Ir a mis canciones
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              {currentSet ? `Mi Lista: ${currentSet.name}` : 'Canciones Destacadas'}
            </h2>
            {currentSet && (
              <Link 
                href={`/setlists?id=${currentSet.id}`}
                className="bg-accent/10 text-accent text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
              >
                Ver Lista Completa
              </Link>
            )}
          </div>
          {setlists.length > 1 && (
            <select 
              value={currentSetId || ''} 
              onChange={(e) => setSelectedSetId(e.target.value)}
              className="bg-transparent text-xs text-muted-foreground border-none focus:ring-0 p-0 cursor-pointer hover:text-accent transition-colors"
            >
              {setlists.map(set => (
                <option key={set.id} value={set.id} className="bg-background text-foreground">
                  Cambiar a: {set.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <Link href="/songs" className="text-sm font-semibold text-accent hover:underline shrink-0">Ver todo el repertorio</Link>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
        {carouselSongs.map((song) => (
          <Link 
            href={`/songs/${song.id}`}
            key={song.id}
            className="flex-none w-64 snap-start group"
          >
            <div className="relative h-80 w-full rounded-3xl bg-muted/50 border border-white/5 p-6 flex flex-col justify-end overflow-hidden transition-all hover:border-accent/30 hover:bg-muted/80">
              {/* Decorative Note Icon */}
              <div className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-accent font-bold">
                  {song.name.toLowerCase().includes('pdf') ? 'Partitura PDF' : 'Acordes Doc'}
                </span>
                <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors truncate">{song.name}</h3>
                <p className="text-sm text-muted-foreground">Google Drive</p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="w-6 h-6 rounded-full border-2 border-muted bg-zinc-800" />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">Acceso rápido</span>
              </div>
            </div>
          </Link>
        ))}
        
        {/* Card para ir a ver todas */}
        <Link 
          href="/songs"
          className="flex-none w-64 snap-start group"
        >
          <div className="relative h-80 w-full rounded-3xl bg-accent/5 border border-dashed border-accent/20 p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-accent/10 hover:border-accent">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-bold text-accent">Ver más canciones</h3>
            <p className="text-xs text-muted-foreground mt-2">Explora todo tu repertorio en Drive</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
