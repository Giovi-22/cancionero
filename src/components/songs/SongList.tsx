'use client'

import { useState, useMemo } from 'react'
import { Song } from '@/types/drive'
import Image from 'next/image'
import Link from 'next/link'

interface SongListProps {
  initialSongs: Song[]
}

export default function SongList({ initialSongs }: SongListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSongs = useMemo(() => {
    return initialSongs.filter(song => 
      song.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [initialSongs, searchQuery])

  return (
    <div className="flex flex-col gap-8">
      {/* Search Bar */}
      <div className="sticky top-20 z-40 -mx-4 px-4 py-4 bg-background/95 backdrop-blur-sm sm:static sm:bg-transparent sm:p-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por título o artista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-muted/30 border border-muted rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-lg shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {filteredSongs.length === 0 
            ? 'No se encontraron resultados' 
            : `Mostrando ${filteredSongs.length} de ${initialSongs.length} canciones`}
        </p>
      </div>

      {/* Grid de Canciones */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredSongs.map((song) => (
          <Link 
            key={song.id}
            href={`/songs/${song.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-muted/30 border border-muted hover:border-accent/50 transition-all hover:bg-muted/50 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center overflow-hidden">
              {song.thumbnailLink ? (
                <Image 
                  src={song.thumbnailLink} 
                  alt={song.name}
                  width={200}
                  height={150}
                  className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="text-4xl opacity-20 font-bold">
                  {song.mimeType.includes('pdf') ? 'PDF' : 'DOC'}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-accent transition-colors">
                {song.name}
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  {song.mimeType.includes('pdf') ? 'PDF' : 'Google Doc'}
                </span>
                <span className="text-xs font-bold text-accent opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                  Tocar ahora →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
