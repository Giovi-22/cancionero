import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { driveService } from "@/services/DriveService";
import HomeSetlistCarousel from "@/components/home/HomeSetlistCarousel";
import UpcomingShows from "@/components/songs/UpcomingShows";
import { Suspense } from "react";

export default async function Home() {
  const session = await auth();
  const folderId = process.env.DRIVE_SHARED_FOLDER_ID;
  
  let songs: any[] = [];
  
  if (session?.accessToken && folderId && folderId !== "tu_folder_id_aqui") {
    try {
      const data = await driveService.getSongsFromFolder(session.accessToken, folderId);
      songs = data.songs;
    } catch (e) {
      console.error("Error fetching songs for home carousel", e);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(139,92,246,0.15)_0%,rgba(2,6,23,0)_100%)]" />
      
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-white/10 hover:ring-white/20">
            Fase 3: Listas Dinámicas & Gestión Pro.{' '}
            <span className="font-semibold text-accent">Listo para el show</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Toda tu música, <br />
          <span className="text-accent">en la palma de tu mano.</span>
        </h1>
        
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Sincroniza tus documentos de Google Drive, lee acordes en tiempo real y 
          olvídate de las carpetas de papel. Diseñado por y para músicos.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/songs"
            className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-all hover:scale-105"
          >
            Ver mis canciones
          </Link>
          <Link href="/setlists" className="text-sm font-semibold leading-6 text-foreground transition-colors hover:text-accent">
            Mis Listas de Temas <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Shows Próximos / En Vivo */}
      <Suspense fallback={null}>
        <UpcomingShows />
      </Suspense>

      {/* Dynamic Song Carousel Section */}
      <div className="mt-16 w-full max-w-7xl px-4 sm:mt-24">
        <HomeSetlistCarousel allSongs={songs} />
      </div>
    </div>
  );
}
