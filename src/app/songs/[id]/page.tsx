import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { driveService } from "@/services/DriveService"
import Link from "next/link"
import NativeSongViewer from "@/components/songs/NativeSongViewer"

import OfflineSongViewer from "@/components/songs/OfflineSongViewer"

interface SongDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function SongDetailsPage({ params }: SongDetailsPageProps) {
  const session = await auth()
  const { id } = await params

  if (!session || !session.accessToken) {
    redirect("/")
  }

  let song;
  let content = "";
  let isOffline = false;
  
  try {
    song = await driveService.getSongDetails(session.accessToken, id)
    
    // Si es un Google Doc, intentamos traer el contenido de texto
    if (song.mimeType === 'application/vnd.google-apps.document') {
      content = await driveService.getSongContent(session.accessToken, id)
    }
  } catch (error) {
    isOffline = true;
  }

  if (isOffline) {
    return <OfflineSongViewer id={id} />
  }

  if (!song) return null;

  const isGoogleDoc = song.mimeType === 'application/vnd.google-apps.document'
  const viewerUrl = song!.webViewLink?.replace('/view', '/preview') || ''

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header Minimalista (solo si no estamos en modo scroll o nativo con su propio header) */}
      {!isGoogleDoc && (
        <header className="sticky top-16 flex items-center justify-between px-4 py-3 bg-background/50 backdrop-blur-md border-b border-muted z-40">
          <div className="flex items-center gap-3 overflow-hidden">
            <Link 
              href="/songs"
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
              {song.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              PDF
            </span>
          </div>
        </header>
      )}

      {/* Area de Visualización */}
      {isGoogleDoc && content ? (
        <NativeSongViewer content={content} title={song.name} id={id} />
      ) : (
        <div className="flex-1 relative w-full bg-zinc-900 overflow-auto py-4 sm:py-8 h-[calc(100vh-64px)]">
          <div className="mx-auto h-full max-w-5xl px-4 sm:px-8 lg:px-12">
            {viewerUrl ? (
              <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl border border-muted/20 bg-white">
                <iframe 
                  src={viewerUrl}
                  className="w-full h-full border-none"
                  allow="autoplay"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <p className="text-muted-foreground">No se puede previsualizar este archivo.</p>
                <a 
                  href={song.webViewLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 text-accent font-bold hover:underline"
                >
                  Abrir en Google Drive Externo →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Back Button (Solo para PDFs, el nativo ya tiene controles arriba) */}
      {!isGoogleDoc && (
        <Link 
          href="/songs"
          className="fixed bottom-6 left-6 p-4 bg-muted/80 backdrop-blur-md text-foreground rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 border border-white/10"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
      )}
    </div>
  )
}
