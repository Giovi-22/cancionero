'use client'

import { useState, useMemo } from 'react'
import { Song } from '@/types/drive'
import Link from 'next/link'
import { useFavorites } from '@/hooks/useFavorites'
import { useSetlists } from '@/hooks/useSetlists'

interface SongListProps {
  initialSongs: Song[]
}

export default function SongList({ initialSongs }: SongListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const { isFavorite, toggleFavorite } = useFavorites()
  const { setlists, addSongToSetlist } = useSetlists()

  const filteredSongs = useMemo(() => {
    return initialSongs.filter(song => {
      const matchesSearch = song.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFavorite = showOnlyFavorites ? isFavorite(song.id) : true
      return matchesSearch && matchesFavorite
    })
  }, [initialSongs, searchQuery, showOnlyFavorites, isFavorite])

  return (
    <div className="flex flex-col gap-8">
      {/* Search Bar & Filters */}
      <div className="sticky top-20 z-40 -mx-4 px-4 py-4 bg-background/95 backdrop-blur-sm sm:static sm:bg-transparent sm:p-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group flex-1">
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
              className="block w-full pl-12 pr-4 py-3 bg-muted/30 border border-muted rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-base shadow-sm"
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

          <button 
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border transition-all font-semibold ${
              showOnlyFavorites 
                ? 'bg-accent/10 border-accent text-accent' 
                : 'bg-muted/30 border-muted text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <svg className={`w-5 h-5 ${showOnlyFavorites ? 'fill-accent' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {showOnlyFavorites ? 'Ver Todas' : 'Favoritos'}
          </button>
        </div>
        
        <p className="mt-3 text-sm text-muted-foreground">
          {filteredSongs.length === 0 
            ? 'No se encontraron resultados' 
            : `Mostrando ${filteredSongs.length} de ${initialSongs.length} canciones`}
        </p>
      </div>

      {/* Lista de Canciones */}
      <div className="flex flex-col gap-2">
        {filteredSongs.map((song) => (
          <div key={song.id} className="group flex items-center gap-2">
            <Link 
              href={`/songs/${song.id}`}
              className="flex-1 flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-transparent hover:border-accent/30 hover:bg-muted/40 transition-all active:scale-[0.99] overflow-hidden"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${song.mimeType.includes('pdf') ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {song.mimeType.includes('pdf') ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-base font-medium text-foreground truncate group-hover:text-accent transition-colors">
                  {song.name}
                </h3>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-muted-foreground font-bold bg-muted/50 px-2 py-1 rounded">
                  {song.mimeType.includes('pdf') ? 'PDF' : 'Doc'}
                </span>
                <svg className="w-5 h-5 text-muted-foreground group-hover:text-accent transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            
            {/* Botón Favorito */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(song.id);
              }}
              className={`p-4 rounded-xl transition-all ${
                isFavorite(song.id) 
                  ? 'text-accent' 
                  : 'text-muted-foreground/30 hover:text-accent/50'
              }`}
            >
              <svg className={`w-6 h-6 ${isFavorite(song.id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>

            {/* Dot Menu */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMenuId(activeMenuId === song.id ? null : song.id);
                }}
                className={`p-4 rounded-xl transition-all ${
                  activeMenuId === song.id ? 'text-accent bg-accent/10' : 'text-muted-foreground/30 hover:text-accent/50'
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {activeMenuId === song.id && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setActiveMenuId(null)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-muted p-2 shadow-2xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                    <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Agregar a una lista:</p>
                    <div className="max-h-48 overflow-y-auto">
                      {setlists.length === 0 ? (
                        <Link href="/setlists" className="block px-3 py-2 text-sm text-accent hover:underline">
                          No tienes listas. Crea una aquí.
                        </Link>
                      ) : (
                        setlists.map(set => (
                          <button
                            key={set.id}
                            onClick={() => {
                              addSongToSetlist(set.id, song.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-accent/10 hover:text-accent transition-all flex items-center justify-between group/item"
                          >
                            <span className="truncate">{set.name}</span>
                            <svg className="w-4 h-4 opacity-0 group-hover/item:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
