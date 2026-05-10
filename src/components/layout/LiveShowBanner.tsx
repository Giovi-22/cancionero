"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLiveSession } from '@/hooks/useLiveSession'
import { useSetlists } from '@/hooks/useSetlists'
import { useAppSettings } from '@/hooks/useAppSettings'
import { CacheService } from '@/services/CacheService'
import { SyncService } from '@/services/SyncService'

export default function LiveShowBanner() {
  const { data: session } = useSession()
  const router = useRouter()
  const { liveSessions, mySession, endShow } = useLiveSession()
  const { setlists } = useSetlists()
  const { settings } = useAppSettings()
  const [dismissed, setDismissed] = useState<string[]>([])

  // Pre-fetch de canciones para caché offline (Director)
  useEffect(() => {
    if (mySession?.status === 'live') {
      const activeSetlist = setlists.find(s => s.id === mySession.setlist_id)
      if (activeSetlist) {
        SyncService.prefetchSongs(activeSetlist.songIds, settings.driveFolderId)
      }
    }
  }, [mySession?.status, mySession?.setlist_id, setlists, settings.driveFolderId])

  // Las sesiones live que NO son mías (para músicos)
  const otherLiveSessions = liveSessions.filter(
    s => s.director_email !== session?.user?.email
  )

  // Solo mostrar las que el músico no descartó
  const visibleSessions = otherLiveSessions.filter(
    s => !dismissed.includes(s.id)
  )

  const handleJoin = (sessionId: string, songId: string | null) => {
    if (!songId) return
    router.push(`/songs/${songId}?follow=${sessionId}`)
  }

  const handleDismiss = (sessionId: string) => {
    setDismissed(prev => [...prev, sessionId])
  }

  // Si el músico descartó una sesión y esta se renueva (nueva canción), no volver a mostrar
  // Solo si cambia el sessionId (director terminó y empezó otro show) se limpia el dismissed
  useEffect(() => {
    if (liveSessions.length === 0) setDismissed([])
  }, [liveSessions.length])

  const hasAnything = visibleSessions.length > 0 || (mySession?.status === 'live')
  
  // Computaciones para controles de navegación del director
  const mySetlist = mySession ? setlists.find(s => s.id === mySession.setlist_id) : null
  const currentSongIndex = mySetlist && mySession?.current_song_id 
    ? mySetlist.songIds.findIndex(id => id === mySession.current_song_id) 
    : -1

  const prevSongId = currentSongIndex > 0 && mySetlist ? mySetlist.songIds[currentSongIndex - 1] : null
  
  let nextSongId = null
  if (mySetlist) {
    if (currentSongIndex === -1 && mySetlist.songIds.length > 0) {
      nextSongId = mySetlist.songIds[0] // Ir a la primera canción
    } else if (currentSongIndex !== -1 && currentSongIndex < mySetlist.songIds.length - 1) {
      nextSongId = mySetlist.songIds[currentSongIndex + 1]
    }
  }

  if (!hasAnything) return null

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-[110] flex flex-col items-center gap-2 p-4 pointer-events-none">

      {/* Banner del DIRECTOR */}
      {mySession?.status === 'live' && (
        <div className="pointer-events-auto w-full max-w-lg animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-background/80 backdrop-blur-2xl px-4 py-3 shadow-2xl shadow-accent/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Show en vivo</p>
                <p className="text-sm font-bold text-foreground truncate max-w-[120px] sm:max-w-[150px]">{mySession.setlist_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Controles de navegación */}
              {mySetlist && (
                <div className="flex items-center gap-1 bg-muted/40 rounded-full p-1 border border-muted">
                  <button 
                    onClick={() => prevSongId && router.push(`/songs/${prevSongId}`)}
                    disabled={!prevSongId}
                    className="p-1.5 rounded-full hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-[10px] font-bold text-muted-foreground min-w-[36px] text-center px-1">
                    {currentSongIndex !== -1 ? `${currentSongIndex + 1}/${mySetlist.songIds.length}` : '-'}
                  </span>
                  <button 
                    onClick={() => nextSongId && router.push(`/songs/${nextSongId}`)}
                    disabled={!nextSongId}
                    className="p-1.5 rounded-full hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                onClick={endShow}
                className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-500/20 transition-all active:scale-95 uppercase tracking-wider"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span className="hidden sm:inline">Fin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner(s) para MÚSICOS */}
      {visibleSessions.map(s => (
        <div
          key={s.id}
          className="pointer-events-auto w-full max-w-lg animate-in slide-in-from-bottom-4 duration-500"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-background/85 backdrop-blur-2xl px-5 py-3 shadow-2xl shadow-accent/10">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Show en vivo</p>
                <p className="text-sm font-bold text-foreground truncate">{s.setlist_name}</p>
                <p className="text-[11px] text-muted-foreground">por {s.director_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleJoin(s.id, s.current_song_id)}
                disabled={!s.current_song_id}
                className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-black text-accent-foreground hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Unirme
              </button>
              <button
                onClick={() => handleDismiss(s.id)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                title="Descartar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
