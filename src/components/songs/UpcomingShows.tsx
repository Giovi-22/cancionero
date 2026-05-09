'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLiveSession } from '@/hooks/useLiveSession'

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'ahora'
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `en ${mins} min`
  const hours = Math.round(diff / 3600000)
  if (hours < 24) return `en ${hours}h`
  return `en ${Math.round(hours / 24)}d`
}

export default function UpcomingShows() {
  const { data: session } = useSession()
  const router = useRouter()
  const { liveSessions, scheduledSessions, mySession, goLiveNow, endShow } = useLiveSession()

  const otherLive = liveSessions.filter(s => s.director_email !== session?.user?.email)
  const otherScheduled = scheduledSessions.filter(s => s.director_email !== session?.user?.email)

  const hasAnything = otherLive.length > 0 || otherScheduled.length > 0 || mySession

  if (!hasAnything) return null

  return (
    <section className="w-full max-w-7xl mx-auto px-4 mt-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
        📅 Shows
      </p>
      <div className="flex flex-col gap-3">

        {/* Mi propia sesión (director) */}
        {mySession && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              {mySession.status === 'live' ? (
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>
              ) : (
                <span className="text-lg">📅</span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">
                  {mySession.status === 'live' ? 'Tu show en vivo' : 'Tu show programado'}
                </p>
                <p className="font-bold text-foreground truncate">{mySession.setlist_name}</p>
                {mySession.status === 'scheduled' && mySession.scheduled_for && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(mySession.scheduled_for).toLocaleString('es-AR', {
                      weekday: 'short', hour: '2-digit', minute: '2-digit'
                    })} · {timeUntil(mySession.scheduled_for)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {mySession.status === 'scheduled' && (
                <button
                  onClick={goLiveNow}
                  className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-black text-accent-foreground hover:bg-accent/90 transition-all active:scale-95"
                >
                  ▶ Iniciar ahora
                </button>
              )}
              <button
                onClick={endShow}
                className="rounded-full bg-muted border border-muted px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Shows en vivo de otros (músicos) */}
        {otherLive.map(s => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">En vivo</p>
                <p className="font-bold text-foreground truncate">{s.setlist_name}</p>
                <p className="text-xs text-muted-foreground">Dirigido por {s.director_name}</p>
              </div>
            </div>
            <button
              onClick={() => s.current_song_id && router.push(`/songs/${s.current_song_id}?follow=${s.id}`)}
              disabled={!s.current_song_id}
              className="flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-black text-accent-foreground hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-accent/30"
            >
              Unirme
            </button>
          </div>
        ))}

        {/* Shows programados de otros */}
        {otherScheduled.map(s => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-muted bg-muted/10 px-5 py-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg shrink-0">📅</span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Próximamente</p>
                <p className="font-bold text-foreground truncate">{s.setlist_name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.director_name} ·{' '}
                  {s.scheduled_for
                    ? `${new Date(s.scheduled_for).toLocaleString('es-AR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} (${timeUntil(s.scheduled_for)})`
                    : 'hora por confirmar'}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-muted px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Próximo
            </span>
          </div>
        ))}

      </div>
    </section>
  )
}
