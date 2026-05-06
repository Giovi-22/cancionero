import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(16,185,129,0.1)_0%,rgba(9,9,11,0)_100%)]" />
      
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-white/10 hover:ring-white/20">
            Fase 2: Interfaz Base & PWA activa.{' '}
            <span className="font-semibold text-accent">Listo para el escenario</span>
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
          <Link href="#features" className="text-sm font-semibold leading-6 text-foreground transition-colors hover:text-accent">
            Saber más <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Decorative Grid or Elements */}
      <div className="mt-16 flow-root sm:mt-24">
        <div className="-m-2 rounded-xl bg-white/5 p-2 ring-1 ring-inset ring-white/10 lg:-m-4 lg:rounded-2xl lg:p-4">
          <div className="flex items-center justify-center gap-8 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
             {/* Simulating some song cards or preview */}
             <div className="h-48 w-32 rounded-lg bg-muted border border-white/10 flex flex-col p-4 gap-2">
                <div className="h-2 w-full bg-white/10 rounded" />
                <div className="h-2 w-2/3 bg-white/10 rounded" />
                <div className="mt-auto h-4 w-full bg-accent/20 rounded" />
             </div>
             <div className="h-56 w-40 rounded-lg bg-muted border border-white/10 flex flex-col p-4 gap-2 scale-110 shadow-2xl shadow-accent/20">
                <div className="h-2 w-full bg-accent/40 rounded" />
                <div className="h-2 w-2/3 bg-white/10 rounded" />
                <div className="h-2 w-1/2 bg-white/10 rounded" />
                <div className="mt-auto h-4 w-full bg-accent rounded" />
             </div>
             <div className="h-48 w-32 rounded-lg bg-muted border border-white/10 flex flex-col p-4 gap-2">
                <div className="h-2 w-full bg-white/10 rounded" />
                <div className="h-2 w-2/3 bg-white/10 rounded" />
                <div className="mt-auto h-4 w-full bg-accent/20 rounded" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
