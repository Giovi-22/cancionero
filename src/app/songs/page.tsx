'use client'

import { useState, useEffect } from 'react'
import SongList from "@/components/songs/SongList"
import { Song } from '@/types/drive'
import { useAppSettings } from '@/hooks/useAppSettings'

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const { settings, isLoading: isSettingsLoading } = useAppSettings()

  useEffect(() => {
    const loadSongs = async () => {
      if (isSettingsLoading) return; // Esperar a que carguen las opciones

      // 1. Intentar cargar de sessionStorage para carga instantánea
      const cached = sessionStorage.getItem(`cancionero_full_repertoire_${settings.driveFolderId}`)
      if (cached) {
        try {
          const data = JSON.parse(cached)
          setSongs(data)
          setLoading(false)
          // Opcional: Re-validar en segundo plano si queremos que sea muy fresco
          return 
        } catch (e) {}
      }

      // 2. Si no hay cache, pedir a la API
      try {
        const url = settings.driveFolderId 
          ? `/api/drive/songs?folderId=${settings.driveFolderId}`
          : '/api/drive/songs'
        
        const response = await fetch(url)
        if (!response.ok) throw new Error('Error al cargar')
        const data = await response.json()
        
        setSongs(data.songs)
        sessionStorage.setItem(`cancionero_full_repertoire_${settings.driveFolderId}`, JSON.stringify(data.songs))
        setLoading(false)
      } catch (e) {
        console.error(e)
        setError(true)
        setLoading(false)
      }
    }

    loadSongs()
  }, [settings.driveFolderId, isSettingsLoading])

  if (loading && songs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-foreground">Sincronizando con Google Drive</h2>
        <p className="text-muted-foreground">Esto solo tardará unos segundos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error de Conexión</h1>
        <p className="text-muted-foreground max-w-md">
          No pudimos conectar con Google Drive. Asegúrate de estar conectado y de tener permisos.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Mi Repertorio
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Accede a todos tus archivos de música sincronizados.
        </p>
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
