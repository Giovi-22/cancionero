import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { driveService } from "@/services/DriveService"
import SetlistManager from "@/components/songs/SetlistManager"

export default async function SetlistsPage() {
  const session = await auth()

  if (!session || !session.accessToken) {
    redirect("/")
  }

  const folderId = process.env.DRIVE_SHARED_FOLDER_ID
  let songs = []
  
  if (folderId && folderId !== "tu_folder_id_aqui") {
    try {
      const songsData = await driveService.getSongsFromFolder(session.accessToken, folderId)
      songs = songsData.songs
    } catch (error) {
      console.error("Error fetching songs for setlists", error)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Mis Listas de Temas
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Organiza tu repertorio para ensayos y presentaciones.
        </p>
      </header>

      <SetlistManager allSongs={songs} />
    </div>
  )
}
