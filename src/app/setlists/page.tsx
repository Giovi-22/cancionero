'use client'

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { driveService } from "@/services/DriveService"
import { Song } from "@/types/drive"
import SetlistManager from "@/components/songs/SetlistManager"

export default function SetlistsPage() {
  const { data: session, status } = useSession()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSongs = async () => {
      if (status === "authenticated" && session?.accessToken) {
        const folderId = process.env.NEXT_PUBLIC_DRIVE_SHARED_FOLDER_ID || "1PYFMlc10NcEScXcF6KzbbhtTLKZ3pB5L"
        try {
          const songsData = await driveService.getSongsFromFolder(session.accessToken, folderId)
          setSongs(songsData.songs)
        } catch (error) {
          console.error("Error fetching songs for setlists", error)
        } finally {
          setLoading(false)
        }
      } else if (status === "unauthenticated") {
        redirect("/")
      }
    };

    if (status !== "loading") {
      fetchSongs()
    }
  }, [session, status])

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    )
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
