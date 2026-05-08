'use client'

import { useState, useEffect } from 'react'
import { Song } from '@/types/drive'
import { useSetlists, Setlist } from '@/hooks/useSetlists'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface SetlistManagerProps {
  allSongs: Song[]
}

export default function SetlistManager({ allSongs }: SetlistManagerProps) {
  const searchParams = useSearchParams()
  const { 
    setlists, 
    createSetlist, 
    deleteSetlist, 
    removeSongFromSetlist, 
    addSongToSetlist,
    moveSongInSetlist,
    toggleSetlistPublic 
  } = useSetlists()
  const [newSetName, setNewSetName] = useState('')
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [isAddingSong, setIsAddingSong] = useState(false)

  // Auto-seleccionar si viene por URL o importar si hay data
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && setlists.find(s => s.id === id)) {
      setSelectedSetId(id)
    }

    const importData = searchParams.get('import')
    if (importData) {
      try {
        const decoded = JSON.parse(atob(importData))
        if (decoded.name && decoded.songIds && Array.isArray(decoded.songIds)) {
          if (confirm(`¿Quieres importar la lista "${decoded.name}" con ${decoded.songIds.length} canciones?`)) {
            const newSet = createSetlist(decoded.name)
            // Agregamos las canciones una por una
            decoded.songIds.forEach((sId: string) => addSongToSetlist(newSet.id, sId))
            alert('¡Lista importada con éxito!')
            setSelectedSetId(newSet.id)
            // Limpiar URL
            window.history.replaceState({}, '', '/setlists')
          }
        }
      } catch (e) {
        console.error('Error importing setlist', e)
      }
    }
  }, [searchParams, setlists, createSetlist, addSongToSetlist])

  const selectedSet = setlists.find(s => s.id === selectedSetId)
  const setlistSongs = selectedSet 
    ? selectedSet.songIds
        .map(id => allSongs.find(song => song.id === id))
        .filter((song): song is Song => !!song)
    : []

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSetName.trim()) return
    const newSet = createSetlist(newSetName.trim())
    setNewSetName('')
    setSelectedSetId(newSet.id)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar: Lista de Setlists */}
      <div className="flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Nombre de la nueva lista..."
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
            className="w-full bg-muted/30 border border-muted rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          />
          <button 
            type="submit"
            className="bg-accent text-accent-foreground font-bold py-2.5 rounded-xl hover:bg-accent/90 transition-all active:scale-95 text-sm"
          >
            + Crear Nueva Lista
          </button>
        </form>

        <div className="flex flex-col gap-2 mt-4">
          {setlists.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-muted rounded-xl">
              Aún no tienes listas creadas.
            </p>
          ) : (
            setlists.map(set => (
              <div 
                key={set.id}
                onClick={() => setSelectedSetId(set.id)}
                className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedSetId === set.id 
                    ? 'bg-accent/10 border-accent/50 text-accent' 
                    : 'bg-muted/20 border-transparent hover:bg-muted/40'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-bold">{set.name}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-60">
                    {set.songIds.length} canciones
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('¿Eliminar esta lista?')) deleteSetlist(set.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Canciones de la Lista Seleccionada */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {selectedSet ? (
          <div className="bg-muted/10 rounded-2xl p-6 sm:p-8 border border-muted min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold">{selectedSet.name}</h2>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleSetlistPublic(selectedSet.id)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      selectedSet.isPublic 
                        ? 'bg-accent/10 border-accent/30 text-accent' 
                        : 'bg-muted border-transparent text-muted-foreground'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedSet.isPublic ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`} />
                    {selectedSet.isPublic ? 'Pública' : 'Privada'}
                  </button>
                  
                  {selectedSet.isPublic && (
                    <button 
                      onClick={() => {
                        const data = btoa(JSON.stringify({ name: selectedSet.name, songIds: selectedSet.songIds }));
                        const url = `${window.location.origin}/setlists?import=${data}`;
                        navigator.clipboard.writeText(url);
                        alert('¡Enlace copiado! Pásalo a la banda para que importen la lista.');
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Copiar enlace para la banda
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsAddingSong(!isAddingSong)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  isAddingSong ? 'bg-muted border-muted text-foreground' : 'bg-accent border-accent text-accent-foreground hover:scale-105'
                }`}
              >
                {isAddingSong ? 'Cerrar Buscador' : '+ Agregar Canción'}
              </button>
            </div>

            {isAddingSong && (
              <div className="mb-8 p-4 bg-muted/20 rounded-xl border border-muted animate-in fade-in slide-in-from-top-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Selecciona para agregar:</p>
                <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-2">
                  {allSongs
                    .filter(s => !selectedSet.songIds.includes(s.id))
                    .map(song => (
                      <button
                        key={song.id}
                        onClick={() => addSongToSetlist(selectedSet.id, song.id)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 hover:text-accent transition-all text-sm text-left"
                      >
                        <span className="truncate">{song.name}</span>
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {setlistSongs.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Esta lista está vacía.</p>
                  <p className="text-sm text-muted-foreground/50">Agrega canciones para empezar a organizar tu show.</p>
                </div>
              ) : (
                setlistSongs.map((song, index) => (
                  <div key={song.id} className="group flex items-center gap-2">
                    <div className="flex flex-col items-center gap-0.5 w-6">
                      <button 
                        onClick={() => moveSongInSetlist(selectedSet.id, song.id, 'up')}
                        disabled={index === 0}
                        className={`text-muted-foreground hover:text-accent transition-colors disabled:opacity-0`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className="text-[10px] font-mono text-muted-foreground/50">{index + 1}</span>
                      <button 
                        onClick={() => moveSongInSetlist(selectedSet.id, song.id, 'down')}
                        disabled={index === setlistSongs.length - 1}
                        className={`text-muted-foreground hover:text-accent transition-colors disabled:opacity-0`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <Link 
                      href={`/songs/${song.id}`}
                      className="flex-1 flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-accent/30 transition-all"
                    >
                      <span className="font-medium group-hover:text-accent transition-colors">{song.name}</span>
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <button 
                      onClick={() => removeSongFromSetlist(selectedSet.id, song.id)}
                      className="p-3 text-muted-foreground/30 hover:text-red-500 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-muted/5 rounded-2xl p-20 border border-dashed border-muted flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-muted-foreground/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h2 className="text-xl font-bold text-muted-foreground">Selecciona una lista</h2>
            <p className="text-sm text-muted-foreground/60 max-w-xs">
              Haz clic en una lista de la izquierda para ver su contenido o crea una nueva.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
