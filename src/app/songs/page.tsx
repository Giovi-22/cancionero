import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { driveService } from "@/services/DriveService"
import SongList from "@/components/songs/SongList"

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
        <p className="mt-2 text-muted-foreground text-lg">
          Accede a todos tus archivos de música sincronizados.
        </p>
      </header>

      {songsData.songs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-muted p-12 text-center">
          <p className="text-muted-foreground">No se encontraron archivos en la carpeta configurada.</p>
        </div>
      ) : (
        <SongList initialSongs={songsData.songs} />
      )}
    </div>
  )
}
