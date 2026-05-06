import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { driveService } from "@/services/DriveService"
import Link from "next/link"

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
  try {
    song = await driveService.getSongDetails(session.accessToken, id)
  } catch (error) {
    notFound()
  }

  // Google Drive Viewer URL
  // Para PDFs y Docs, podemos usar el webViewLink directamente en un iframe
  // o forzar el modo visualización
  const viewerUrl = song.webViewLink?.replace('/view', '/preview') || ''

  return (
    <div className="flex flex-col h-screen max-h-screen bg-black overflow-hidden">
      {/* Top Bar - Solo visible al mover el mouse o tocar, pero por ahora fija y minimalista */}
      <header className="flex items-center justify-between px-4 py-3 bg-background/50 backdrop-blur-md border-b border-muted z-50">
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
            {song.mimeType.includes('pdf') ? 'PDF' : 'Google Doc'}
          </span>
        </div>
      </header>

      {/* Viewer Area */}
      <div className="flex-1 relative w-full h-full bg-zinc-900">
        {viewerUrl ? (
          <iframe 
            src={viewerUrl}
            className="w-full h-full border-none"
            allow="autoplay"
          />
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

      {/* Floating Action Button (Opcional - para facilitar volver en tablets) */}
      <Link 
        href="/songs"
        className="fixed bottom-6 right-6 p-4 bg-accent text-accent-foreground rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all sm:hidden z-50"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Link>
    </div>
  )
}
