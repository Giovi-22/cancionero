'use client'

import Link from 'next/link'
import Image from 'next/image'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  return (
    <nav className="sticky top-0 z-50 border-b border-muted bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/10 p-1 backdrop-blur-sm border border-white/10">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain invert"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Cancionero<span className="text-accent">Pro</span>
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link 
                href="/songs" 
                className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                Repertorio
              </Link>
              <Link 
                href="/setlists" 
                className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                Mis Listas
              </Link>
              <div className="flex items-center gap-3 ml-2 border-l border-muted pl-4">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-foreground">{session.user?.name}</p>
                  <button 
                    onClick={() => signOut()}
                    className="text-[10px] text-muted-foreground hover:text-accent transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
                {session.user?.image ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-accent/30">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <span className="text-accent text-xs font-bold">
                      {session.user?.name?.[0] || 'U'}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
              <button 
                onClick={() => signIn('google')}
                disabled={isLoading}
                className="rounded-full bg-accent px-5 py-1.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>
            )}
        </div>
      </div>
    </nav>
  )
}
