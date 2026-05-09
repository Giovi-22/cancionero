'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase'

export interface LiveSession {
  id: string
  setlist_id: string
  setlist_name: string
  director_email: string
  director_name: string
  current_song_id: string | null
  status: 'scheduled' | 'live'
  scheduled_for: string | null
  started_at: string | null
  created_at: string
}

// Singleton de sesiones para evitar múltiples suscripciones al mismo canal
let globalSessions: LiveSession[] = []
let globalListeners: Array<(sessions: LiveSession[]) => void> = []
let channelSubscribed = false

function notifyListeners(sessions: LiveSession[]) {
  globalSessions = sessions
  globalListeners.forEach(fn => fn(sessions))
}

async function fetchGlobalSessions() {
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      notifyListeners(data as LiveSession[])
    }
  } catch {
    // Tabla aún no creada u otro error — ignorar silenciosamente
  }
}

function ensureGlobalChannel() {
  if (channelSubscribed) return
  channelSubscribed = true

  supabase
    .channel('live_sessions_global_v2')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'live_sessions' },
      () => { fetchGlobalSessions() }
    )
    .subscribe()

  fetchGlobalSessions()
}

// ─────────────────────────────────────────────
export function useLiveSession() {
  const { data: sessionData } = useSession()
  const userEmail = sessionData?.user?.email ?? null
  const userName  = sessionData?.user?.name  ?? userEmail ?? ''

  const [activeSessions, setActiveSessions] = useState<LiveSession[]>(globalSessions)
  const [isLoading, setIsLoading] = useState(globalSessions.length === 0)
  const listenerRef = useRef<((s: LiveSession[]) => void) | null>(null)

  // Suscribirse a las actualizaciones globales (un solo canal compartido)
  useEffect(() => {
    ensureGlobalChannel()

    const listener = (sessions: LiveSession[]) => {
      setActiveSessions([...sessions])
      setIsLoading(false)
    }
    listenerRef.current = listener
    globalListeners.push(listener)

    // Si ya hay datos cargados, usarlos inmediatamente
    if (globalSessions.length > 0) {
      setActiveSessions([...globalSessions])
      setIsLoading(false)
    }

    return () => {
      globalListeners = globalListeners.filter(fn => fn !== listener)
    }
  }, [])

  const mySession = activeSessions.find(s => s.director_email === userEmail) ?? null

  // ── Acciones del director ──────────────────

  const startShow = async (setlistId: string, setlistName: string) => {
    if (!userEmail) return { data: null, error: 'No autenticado' }

    if (mySession) {
      const { data, error } = await supabase
        .from('live_sessions')
        .update({ status: 'live', started_at: new Date().toISOString(), setlist_id: setlistId, setlist_name: setlistName })
        .eq('id', mySession.id)
        .select()
        .single()
      return { data: data as LiveSession | null, error: error?.message ?? null }
    }

    const { data, error } = await supabase
      .from('live_sessions')
      .insert({
        setlist_id: setlistId,
        setlist_name: setlistName,
        director_email: userEmail,
        director_name: userName,
        status: 'live',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    return { data: data as LiveSession | null, error: error?.message ?? null }
  }

  const scheduleShow = async (setlistId: string, setlistName: string, scheduledFor: Date) => {
    if (!userEmail) return null

    if (mySession) {
      const { data } = await supabase
        .from('live_sessions')
        .update({
          setlist_id: setlistId,
          setlist_name: setlistName,
          status: 'scheduled',
          scheduled_for: scheduledFor.toISOString(),
          started_at: null,
        })
        .eq('id', mySession.id)
        .select()
        .single()
      return data as LiveSession | null
    }

    const { data } = await supabase
      .from('live_sessions')
      .insert({
        setlist_id: setlistId,
        setlist_name: setlistName,
        director_email: userEmail,
        director_name: userName,
        status: 'scheduled',
        scheduled_for: scheduledFor.toISOString(),
      })
      .select()
      .single()
    return data as LiveSession | null
  }

  const goLiveNow = async () => {
    if (!mySession) return
    await supabase
      .from('live_sessions')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', mySession.id)
  }

  const endShow = async () => {
    if (!mySession) return
    await supabase.from('live_sessions').delete().eq('id', mySession.id)
  }

  const updateCurrentSong = useCallback(async (songId: string) => {
    if (!mySession || mySession.status !== 'live') return
    await supabase
      .from('live_sessions')
      .update({ current_song_id: songId })
      .eq('id', mySession.id)
  }, [mySession?.id, mySession?.status])  // eslint-disable-line

  // ── Modo seguidor ──────────────────────────

  const subscribeToSession = useCallback((
    sessionId: string,
    onSongChange: (songId: string) => void
  ) => {
    const channel = supabase
      .channel(`live_follow_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newSongId = payload.new?.current_song_id
          if (newSongId) onSongChange(newSongId)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const liveSessions      = activeSessions.filter(s => s.status === 'live')
  const scheduledSessions = activeSessions.filter(s => s.status === 'scheduled')

  return {
    activeSessions,
    liveSessions,
    scheduledSessions,
    mySession,
    isLoading,
    startShow,
    scheduleShow,
    goLiveNow,
    endShow,
    updateCurrentSong,
    subscribeToSession,
  }
}
