'use client'

import { useState, useEffect, useRef } from 'react'
import { transposeText, trimCommonIndentation } from '@/utils/chordUtils'
import { useFavorites } from '@/hooks/useFavorites'

interface NativeSongViewerProps {
  content: string
  title: string
  id: string
}

export default function NativeSongViewer({ content, title, id }: NativeSongViewerProps) {
  const [transpose, setTranspose] = useState(0)
  const [capo, setCapo] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const [isStageMode, setIsStageMode] = useState(false)
  const [musicianNotes, setMusicianNotes] = useState<Record<number, string>>({})
  const [editingLine, setEditingLine] = useState<number | null>(null)
  const [showNotes, setShowNotes] = useState(true) // Activado por defecto para verlas
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  const toggleStageMode = () => {
    if (!isStageMode) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
    setIsStageMode(!isStageMode)
  }

  // Escuchar cambio de fullscreen para sincronizar el estado
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

  // Cargar configuración guardada
  useEffect(() => {
    const saved = localStorage.getItem(`song_settings_${id}`)
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        if (typeof settings.transpose === 'number') setTranspose(settings.transpose)
        if (typeof settings.capo === 'number') setCapo(settings.capo)
        if (typeof settings.fontSize === 'number') setFontSize(settings.fontSize)
        if (settings.musicianNotes && typeof settings.musicianNotes === 'object') {
          setMusicianNotes(settings.musicianNotes)
        }
      } catch (e) {
        console.error('Error loading settings', e)
      }
    }
  }, [id])

  // Guardar configuración al cambiar
  useEffect(() => {
    localStorage.setItem(`song_settings_${id}`, JSON.stringify({
      transpose,
      capo,
      fontSize,
      musicianNotes
    }))
  }, [id, transpose, capo, fontSize, musicianNotes])

  // Transposición combinada (Tono + Capo) y limpieza de sangría
  const rawTransposed = transposeText(content, transpose - capo)
  const displayContent = trimCommonIndentation(rawTransposed)

  // Lógica de Auto-scroll
  useEffect(() => {
    if (isScrolling) {
      scrollIntervalRef.current = setInterval(() => {
        if (window) {
          window.scrollBy({ top: scrollSpeed, behavior: 'auto' })
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            setIsScrolling(false)
          }
        }
      }, 50)
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current)
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current)
    }
  }, [isScrolling, scrollSpeed])

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isStageMode ? 'bg-black' : 'bg-background'} pb-32`}>
      {/* Controles Flotantes Superiores */}
      {!isStageMode && (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-muted px-4 py-4 sm:px-8 animate-in fade-in slide-in-from-top-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Control de Tono */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Transponer (Semitonos)</span>
                <div className="flex items-center bg-muted/50 rounded-full p-1 border border-white/5">
                  <button 
                    onClick={() => setTranspose(prev => prev - 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-full transition-all"
                    title="-1 Semitono"
                  >
                    -
                  </button>
                  <span className="w-14 text-center font-mono font-bold text-accent">
                    {transpose > 0 ? `+${transpose}` : transpose} st
                  </span>
                  <button 
                    onClick={() => setTranspose(prev => prev + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-full transition-all"
                    title="+1 Semitono"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Control de Capodastro */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Capo</span>
                <select 
                  value={capo} 
                  onChange={(e) => setCapo(Number(e.target.value))}
                  className="bg-muted/50 border border-white/5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-bold text-accent focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(fret => (
                    <option key={fret} value={fret}>
                      {fret === 0 ? 'Sin Capo' : `Traste ${fret}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Control de Tamaño de Fuente */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Zoom</span>
                <div className="flex items-center bg-muted/50 rounded-full p-1 border border-white/5">
                  <button 
                    onClick={() => setFontSize(prev => Math.max(10, prev - 2))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-full transition-all text-xs"
                  >
                    A-
                  </button>
                  <button 
                    onClick={() => setFontSize(prev => Math.min(40, prev + 2))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-full transition-all text-base"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Favorito */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Fav</span>
                <button 
                  onClick={() => toggleFavorite(id)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all border border-white/5 ${
                    isFavorite(id) 
                      ? 'bg-accent/10 text-accent' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  <svg className={`w-5 h-5 ${isFavorite(id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>

              {/* Notas del Músico */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Notas</span>
                <button 
                  onClick={() => setShowNotes(!showNotes)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all border border-white/5 ${
                    showNotes 
                      ? 'bg-accent text-white' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
               {/* Modo Escenario Toggle */}
               <button 
                onClick={toggleStageMode}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all font-bold text-sm"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                 </svg>
                 Escenario
               </button>

               {/* Auto-scroll Toggle */}
             <div className="flex items-center gap-2 bg-muted/30 rounded-full px-4 py-2 border border-white/5">
                <button 
                  onClick={() => setIsScrolling(!isScrolling)}
                  className={`flex items-center gap-2 text-sm font-bold transition-colors ${isScrolling ? 'text-accent' : 'text-muted-foreground'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${isScrolling ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`} />
                  {isScrolling ? 'Scroll ON' : 'Scroll OFF'}
                </button>
                {isScrolling && (
                  <div className="flex items-center gap-1 ml-2 border-l border-muted pl-2">
                    <button onClick={() => setScrollSpeed(Math.max(0.5, scrollSpeed - 0.5))} className="hover:text-accent text-xs">Slower</button>
                    <span className="text-[10px] bg-muted px-1.5 rounded text-white">x{scrollSpeed}</span>
                    <button onClick={() => setScrollSpeed(Math.min(5, scrollSpeed + 0.5))} className="hover:text-accent text-xs">Faster</button>
                  </div>
                )}
             </div>
          </div>
          </div>
        </div>
      )}

      {/* Panel de Notas del Músico */}
      {showNotes && (
        <div className="max-w-5xl mx-auto w-full px-6 mt-8 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-xs font-bold text-accent uppercase tracking-widest">Notas Personales</h3>
              </div>
              <button onClick={() => setShowNotes(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={musicianNotes}
              onChange={(e) => setMusicianNotes(e.target.value)}
              placeholder="Escribe aquí tus notas (ej: Intro G-D, voz suave, etc...)"
              className="w-full bg-transparent border-none focus:ring-0 text-sm text-foreground/80 placeholder:text-muted-foreground/30 min-h-[100px] resize-none"
            />
          </div>
        </div>
      )}

      {/* Contenido de la Canción (Renderizado por Línea) */}
      <div className="w-full max-w-5xl pl-4 sm:pl-12 md:pl-24 py-12 pr-6">
        <div 
          ref={viewerRef}
          className={`font-mono whitespace-pre leading-relaxed select-none transition-colors duration-500 ${isStageMode ? 'text-white' : 'text-foreground/90'}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {displayContent.split('\n').map((line, index) => (
            <div 
              key={index} 
              className="group relative min-h-[1.5em] hover:bg-accent/5 transition-colors cursor-pointer rounded px-2 -mx-2"
              onClick={() => !isStageMode && setEditingLine(index)}
            >
              {/* La línea de la canción */}
              <div className={line.trim() === '' ? 'h-4' : ''}>
                {line || ' '}
              </div>

              {/* Nota contextual flotante en el margen derecho */}
              {musicianNotes[index] && (
                <div className={`absolute left-full ml-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-[9px] px-2.5 py-1 rounded-lg font-sans font-bold animate-in fade-in slide-in-from-left-2 shadow-lg flex items-center gap-2 group/note ${
                  isStageMode 
                    ? 'bg-yellow-500 text-black shadow-yellow-500/20' 
                    : 'bg-muted border border-accent/30 text-accent shadow-black/20'
                }`}>
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-inherit rotate-45 border-l border-b border-inherit" />
                  <span>{musicianNotes[index]}</span>
                  
                  {!isStageMode && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newNotes = { ...musicianNotes };
                        delete newNotes[index];
                        setMusicianNotes(newNotes);
                      }}
                      className="opacity-0 group-hover/note:opacity-100 ml-1 hover:text-red-500 transition-all p-0.5"
                      title="Eliminar nota"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Input para editar la nota */}
              {editingLine === index && (
                <div className="absolute left-0 top-full z-20 mt-1 w-64 bg-muted border border-accent/30 rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
                  <input
                    autoFocus
                    className="w-full bg-transparent border-none focus:ring-0 text-xs text-foreground placeholder:text-muted-foreground/30"
                    placeholder="Escribe una nota para esta línea..."
                    value={musicianNotes[index] || ''}
                    onChange={(e) => {
                      const newNotes = { ...musicianNotes };
                      if (e.target.value) {
                        newNotes[index] = e.target.value;
                      } else {
                        delete newNotes[index];
                      }
                      setMusicianNotes(newNotes);
                    }}
                    onBlur={() => setEditingLine(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingLine(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              
              {/* Indicador de edición hover */}
              {!musicianNotes[index] && !isStageMode && (
                <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <svg className="w-3 h-3 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Exit Stage Mode (Solo en Stage Mode) */}
      {isStageMode && (
        <button 
          onClick={toggleStageMode}
          className="fixed top-8 right-8 z-50 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white p-4 rounded-full backdrop-blur-md transition-all border border-white/10"
          title="Salir del Modo Escenario"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Floating Info (Mobile) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-accent/90 backdrop-blur-md text-accent-foreground px-6 py-3 rounded-full shadow-2xl font-bold text-xs sm:hidden">
        <span>Tono: {transpose > 0 ? `+${transpose}` : transpose}</span>
        <span className="opacity-30">|</span>
        <span>Capo: {capo}</span>
        <span className="opacity-30">|</span>
        <span>Zoom: {fontSize}px</span>
      </div>
    </div>
  )
}
