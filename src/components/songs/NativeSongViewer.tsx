'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase'
import { transposeText, trimCommonIndentation, cleanSongText } from '@/utils/chordUtils'
import { useFavorites } from '@/hooks/useFavorites'
import { useSetlists } from '@/hooks/useSetlists'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface NativeSongViewerProps {
  content: string
  title: string
  id: string
}

export default function NativeSongViewer({ content, title, id }: NativeSongViewerProps) {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const setlistId = searchParams.get('setlist')
  
  const [transpose, setTranspose] = useState(0)
  const [capo, setCapo] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const [isStageMode, setIsStageMode] = useState(false)
  const [musicianNotes, setMusicianNotes] = useState<Record<number, string>>({})
  const [editingLine, setEditingLine] = useState<number | null>(null)
  const [showNotes, setShowNotes] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Metrónomo
  const [bpm, setBpm] = useState(120)
  const [isMetronomeActive, setIsMetronomeActive] = useState(false)
  const [beat, setBeat] = useState(false)

  // Sincronización de Banda
  const [isFollowingBand, setIsFollowingBand] = useState(false)
  const { subscribeToSetlist, syncCurrentSong } = useSetlists()

  // Lógica de Metrónomo
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isMetronomeActive) {
      const msPerBeat = 60000 / bpm
      interval = setInterval(() => {
        setBeat(prev => !prev)
        setTimeout(() => setBeat(prev => !prev), 100)
      }, msPerBeat)
    }
    return () => clearInterval(interval)
  }, [isMetronomeActive, bpm])

  // Lógica de Sincronización
  useEffect(() => {
    if (isFollowingBand && setlistId) {
      const unsubscribe = subscribeToSetlist(setlistId, (newSongId) => {
        if (newSongId !== id) {
          router.push(`/songs/${newSongId}?setlist=${setlistId}`)
        }
      })
      return () => unsubscribe()
    }
  }, [isFollowingBand, setlistId, id, router, subscribeToSetlist])

  // Lógica de Líder
  useEffect(() => {
    if (setlistId && session?.user?.email) {
      syncCurrentSong(setlistId, id)
    }
  }, [id, setlistId, session, syncCurrentSong])

  const viewerRef = useRef<HTMLDivElement>(null)
  const scrollRequestRef = useRef<number | null>(null)
  const lastScrollTimeRef = useRef<number>(0)

  const toggleStageMode = () => {
    if (!isStageMode) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
    setIsStageMode(!isStageMode)
  }

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsStageMode(false)
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const { isFavorite, toggleFavorite } = useFavorites()

  // Cargar configuración
  useEffect(() => {
    const loadSettings = async () => {
      const saved = sessionStorage.getItem(`song_settings_${id}`)
      if (saved) {
        try {
          const s = JSON.parse(saved)
          if (typeof s.transpose === 'number') setTranspose(s.transpose)
          if (typeof s.capo === 'number') setCapo(s.capo)
          if (typeof s.fontSize === 'number') setFontSize(s.fontSize)
          if (s.musicianNotes) setMusicianNotes(s.musicianNotes)
        } catch (e) {}
      }

      if (session?.user?.email) {
        setIsSyncing(true)
        const { data } = await supabase
          .from('song_settings')
          .select('*')
          .eq('user_email', session.user.email)
          .eq('song_id', id)
          .maybeSingle()

        if (data) {
          setTranspose(data.transpose)
          setCapo(data.capo)
          setFontSize(data.font_size)
          setMusicianNotes(data.musician_notes || {})
        }
        setIsSyncing(false)
      }
    }
    loadSettings()
  }, [id, session])

  // Guardar configuración (Debounce)
  useEffect(() => {
    const timer = setTimeout(async () => {
      sessionStorage.setItem(`song_settings_${id}`, JSON.stringify({
        transpose, capo, fontSize, musicianNotes
      }))

      if (session?.user?.email) {
        await supabase
          .from('song_settings')
          .upsert({
            user_email: session.user.email,
            song_id: id,
            transpose,
            capo,
            font_size: fontSize,
            musician_notes: musicianNotes,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_email,song_id' })
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [id, transpose, capo, fontSize, musicianNotes, session])

  const cleanedContent = cleanSongText(content)
  const rawTransposed = transposeText(cleanedContent, transpose - capo)
  const displayContent = trimCommonIndentation(rawTransposed)

  // Motor de Auto-scroll
  useEffect(() => {
    const scrollStep = (timestamp: number) => {
      if (!lastScrollTimeRef.current) lastScrollTimeRef.current = timestamp
      const deltaTime = timestamp - lastScrollTimeRef.current
      lastScrollTimeRef.current = timestamp

      if (isScrolling) {
        const moveAmount = scrollSpeed * 0.03 * deltaTime
        window.scrollBy(0, moveAmount)
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 5) {
          setIsScrolling(false)
        } else {
          scrollRequestRef.current = requestAnimationFrame(scrollStep)
        }
      }
    }

    if (isScrolling) {
      lastScrollTimeRef.current = 0
      scrollRequestRef.current = requestAnimationFrame(scrollStep)
    } else {
      if (scrollRequestRef.current) cancelAnimationFrame(scrollRequestRef.current)
    }
    return () => {
      if (scrollRequestRef.current) cancelAnimationFrame(scrollRequestRef.current)
    }
  }, [isScrolling, scrollSpeed])

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isStageMode ? 'bg-black' : 'bg-background'} pb-32`}>
      
      {/* Top Header Compacto */}
      {!isStageMode && (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-muted px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/songs" className="p-2 hover:bg-muted rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-muted rounded-full text-accent transition-colors relative"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {isSyncing && <div className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />}
            </button>
            <button 
              onClick={toggleStageMode}
              className="hidden sm:flex items-center gap-2 bg-zinc-900 text-white px-4 py-1.5 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all font-bold text-xs"
            >
              Escenario
            </button>
          </div>
        </header>
      )}

      {/* Contenido de la Canción */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-16 py-12">
        <div 
          ref={viewerRef}
          className={`font-mono whitespace-pre-wrap break-words leading-relaxed select-none transition-colors duration-500 ${isStageMode ? 'text-white' : 'text-foreground/90'}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {displayContent.split('\n').map((line, index) => (
            <div 
              key={index} 
              className="group relative min-h-[1.5em] hover:bg-accent/5 transition-colors cursor-pointer rounded px-2 -mx-2"
              onClick={() => !isStageMode && setEditingLine(index)}
            >
              <div className={line.trim() === '' ? 'h-4' : ''}>
                {line || ' '}
              </div>

              {/* Nota contextual */}
              {musicianNotes[index] && (
                <div className={`absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] px-2 py-1 rounded-lg font-sans font-bold shadow-lg flex items-center gap-2 ${
                  isStageMode ? 'bg-yellow-500 text-black' : 'bg-muted text-accent'
                }`}>
                  <span>{musicianNotes[index]}</span>
                </div>
              )}

              {/* Input nota */}
              {editingLine === index && (
                <div className="absolute left-0 top-full z-20 mt-1 w-64 bg-muted border border-accent/30 rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
                  <input
                    autoFocus
                    className="w-full bg-transparent border-none focus:ring-0 text-xs text-foreground"
                    placeholder="Nota..."
                    value={musicianNotes[index] || ''}
                    onChange={(e) => {
                      const newNotes = { ...musicianNotes };
                      if (e.target.value) newNotes[index] = e.target.value;
                      else delete newNotes[index];
                      setMusicianNotes(newNotes);
                    }}
                    onBlur={() => setEditingLine(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingLine(null)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Floating Bar - Quick Controls */}
      {!isStageMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-background/80 backdrop-blur-2xl px-4 py-2 rounded-full border border-muted shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
          {/* Tono */}
          <div className="flex items-center bg-muted/40 rounded-full px-2">
            <button onClick={() => setTranspose(prev => prev - 1)} className="w-8 h-8 flex items-center justify-center hover:text-accent">-</button>
            <span className="w-10 text-center text-xs font-bold font-mono">{transpose > 0 ? `+${transpose}` : transpose}</span>
            <button onClick={() => setTranspose(prev => prev + 1)} className="w-8 h-8 flex items-center justify-center hover:text-accent">+</button>
          </div>
          <div className="w-px h-6 bg-muted mx-1" />
          {/* Scroll Toggle */}
          <button 
            onClick={() => setIsScrolling(!isScrolling)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all font-bold text-xs ${isScrolling ? 'bg-accent text-white' : 'hover:bg-muted'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isScrolling ? 'bg-white animate-pulse' : 'bg-muted-foreground'}`} />
            {isScrolling ? `${scrollSpeed.toFixed(1)}x` : 'Scroll'}
          </button>
          {isScrolling && (
             <div className="flex items-center gap-1">
                <button onClick={() => setScrollSpeed(Math.max(0.1, scrollSpeed - 0.1))} className="p-1 hover:text-accent">-</button>
                <button onClick={() => setScrollSpeed(Math.min(4, scrollSpeed + 0.1))} className="p-1 hover:text-accent">+</button>
             </div>
          )}
          <div className="w-px h-6 bg-muted mx-1" />
          {/* Stage Button (Mobile) */}
          <button onClick={toggleStageMode} className="p-2 hover:bg-muted rounded-full sm:hidden">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Settings Drawer (Bottom Sheet) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[32px] p-8 border-t border-muted shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {/* Columna 1 */}
              <div className="space-y-6">
                {/* Capodastro */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Capodastro</label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5].map(f => (
                      <button 
                        key={f}
                        onClick={() => setCapo(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${capo === f ? 'bg-accent border-accent text-white' : 'bg-muted/50 border-transparent text-muted-foreground'}`}
                      >
                        {f === 0 ? 'Sin Capo' : f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Zoom de Letra</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setFontSize(prev => Math.max(10, prev - 2))} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">A-</button>
                    <span className="text-xl font-bold font-mono">{fontSize}px</span>
                    <button onClick={() => setFontSize(prev => Math.min(40, prev + 2))} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">A+</button>
                  </div>
                </div>
              </div>

              {/* Columna 2 */}
              <div className="space-y-6">
                {/* Metrónomo */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Metrónomo (BPM)</label>
                  <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-2xl">
                    <input 
                      type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="w-12 text-center font-bold text-accent">{bpm}</span>
                    <button 
                      onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMetronomeActive ? 'bg-accent text-white' : 'bg-muted'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${beat ? 'bg-white scale-150' : 'bg-current'} transition-all`} />
                    </button>
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => toggleFavorite(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold border transition-all ${isFavorite(id) ? 'bg-accent/10 border-accent text-accent' : 'bg-muted/50 border-transparent text-muted-foreground'}`}
                  >
                    <svg className={`w-5 h-5 ${isFavorite(id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {isFavorite(id) ? 'Favorito' : 'Favorito'}
                  </button>
                  {setlistId && (
                    <button 
                      onClick={() => setIsFollowingBand(!isFollowingBand)}
                      className={`flex-1 py-3 rounded-2xl font-bold border transition-all ${isFollowingBand ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-muted/50 border-transparent text-muted-foreground'}`}
                    >
                      {isFollowingBand ? '• Banda ON' : 'Seguir Banda'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="mt-8 w-full py-4 bg-accent text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-accent/90 transition-all"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Stage Mode Exit Button */}
      {isStageMode && (
        <button 
          onClick={toggleStageMode}
          className="fixed top-8 right-8 z-50 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white p-4 rounded-full backdrop-blur-md transition-all border border-white/10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
