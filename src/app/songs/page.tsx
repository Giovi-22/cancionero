'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import SongList from "@/components/songs/SongList"
import { Song } from '@/types/drive'
import { useAppSettings } from '@/hooks/useAppSettings'
import { CacheService } from '@/services/CacheService'

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  const { data: session, status } = useSession()
  const { settings, isLoading: isSettingsLoading } = useAppSettings()

  useEffect(() => {
    const loadSongs = async () => {
      if (isSettingsLoading) return;

      // 1. Intentar cargar de IndexedDB primero
      const cachedSongs = await CacheService.getRepertoire(settings.driveFolderId || 'root')
      if (cachedSongs && cachedSongs.length > 0) {
        setSongs(cachedSongs)
        setLoading(false)
      }

      // 2. Pedir a la API para actualizar si hay red
      try {
        const url = settings.driveFolderId 
          ? `/api/drive/songs?folderId=${settings.driveFolderId}`
          : '/api/drive/songs'
        
        const response = await fetch(url)
        if (!response.ok) {
          if (cachedSongs && cachedSongs.length > 0) {
            setIsOffline(true)
            return
          }
          throw new Error('Error al cargar')
        }
        const data = await response.json()
        
        setSongs(data.songs)
        await CacheService.saveRepertoire(settings.driveFolderId || 'root', data.songs)
        setLoading(false)
        setIsOffline(false)
      } catch (e) {
        console.error('Error cargando canciones:', e)
        if (cachedSongs && cachedSongs.length > 0) {
          setIsOffline(true)
        } else {
          setError(true)
        }
        setLoading(false)
      }
    }

    loadSongs()
  }, [settings.driveFolderId, isSettingsLoading])

  // Si estamos cargando y NO hay canciones en cache, mostramos spinner
  if (loading && songs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-foreground">Sincronizando con Google Drive</h2>
        <p className="text-muted-foreground">Esto solo tardará unos segundos...</p>
      </div>
    )
  }

  // Solo mostrar error si NO hay canciones cargadas (ni de cache ni de red)
  if (error && songs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error de Conexión</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          No pudimos conectar con Google Drive y no tienes canciones guardadas para uso offline.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-accent text-white px-6 py-2 rounded-full font-bold"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Mi Repertorio
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Accede a todos tus archivos de música sincronizados.
          </p>
        </div>
        
        {isOffline && (
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 px-4 py-2 rounded-xl border border-yellow-500/20 self-start animate-in fade-in slide-in-from-top-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">Modo Offline</span>
          </div>
        )}
      </header>

      {songs.length === 0 && !loading ? (
        <div className="rounded-2xl border-2 border-dashed border-muted p-12 text-center">
          <p className="text-muted-foreground">No se encontraron archivos en la carpeta configurada.</p>
        </div>
      ) : (
        <SongList initialSongs={songs} />
      )}
    </div>
  )
}
