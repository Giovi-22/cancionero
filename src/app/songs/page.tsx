import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { driveService } from "@/services/DriveService"
import Image from "next/image"

export default async function SongsPage() {
  const session = await auth()

  if (!session || !session.accessToken) {
    redirect("/")
  }

  const folderId = process.env.DRIVE_SHARED_FOLDER_ID
  
  if (!folderId || folderId === "tu_folder_id_aqui") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Configuración Pendiente</h1>
        <p className="text-muted-foreground max-w-md">
          Para ver tus canciones, debes configurar el ID de la carpeta compartida en tu archivo 
          <code className="bg-muted px-1.5 py-0.5 rounded text-accent mx-1">.env.local</code>.
        </p>
      </div>
    )
  }

  let songsData;
  try {
    songsData = await driveService.getSongsFromFolder(session.accessToken, folderId)
  } catch (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error de Conexión</h1>
        <p className="text-muted-foreground max-w-md">
          No pudimos conectar con Google Drive. Asegúrate de que las credenciales sean correctas y 
          tengas permisos suficientes.
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
        <p className="mt-2 text-muted-foreground">
          {songsData.songs.length} canciones encontradas en tu Drive.
        </p>
      </header>

      {songsData.songs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-muted p-12 text-center">
          <p className="text-muted-foreground">No se encontraron archivos en la carpeta configurada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {songsData.songs.map((song) => (
            <div 
              key={song.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-muted/30 border border-muted hover:border-accent/50 transition-all hover:bg-muted/50"
            >
              <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center overflow-hidden">
                {song.thumbnailLink ? (
                  <Image 
                    src={song.thumbnailLink} 
                    alt={song.name}
                    width={200}
                    height={150}
                    className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="text-4xl opacity-20">
                    {song.mimeType.includes('pdf') ? 'PDF' : 'DOC'}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">
                  {song.name}
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    {song.mimeType.includes('pdf') ? 'PDF' : 'Google Doc'}
                  </span>
                  <a 
                    href={song.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-accent hover:underline"
                  >
                    Abrir →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
