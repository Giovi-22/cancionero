'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isLoading = status === 'loading'

  // Si hay un error de refresco de token, cerramos sesión automáticamente
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signOut()
    }
  }, [session])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  
  // Consideramos "autenticado" solo si hay sesión Y no hay error
  const isAuthenticated = session && !session.error

  return (
    <nav className="sticky top-0 z-50 border-b border-muted bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
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
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
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
              <Link 
                href="/settings" 
                className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                Configuración
              </Link>
              <div className="flex items-center gap-3 ml-2 border-l border-muted pl-4">
                <div className="text-right">
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

        {/* Mobile Burger Button */}
        <div className="flex md:hidden">
          <button
            onClick={toggleMenu}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
          >
            <span className="sr-only">Abrir menú</span>
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-muted bg-background/95 backdrop-blur-lg animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1 px-4 pb-6 pt-4">
              {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-3 py-4 mb-2 border-b border-muted">
                  {session.user?.image ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-accent/30">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                      <span className="text-accent text-sm font-bold">
                        {session.user?.name?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{session.user?.email}</p>
                  </div>
                </div>
                
                <Link 
                  href="/songs" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  Repertorio
                </Link>
                <Link 
                  href="/setlists" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  Mis Listas
                </Link>
                <Link 
                  href="/settings" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  Configuración
                </Link>
                
                <div className="mt-4 pt-4 border-t border-muted">
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut()
                    }}
                    className="flex w-full items-center justify-center rounded-lg bg-muted py-3 text-sm font-bold text-red-400 hover:bg-muted/80"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false)
                    signIn('google')
                  }}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg bg-accent py-3 text-base font-bold text-accent-foreground shadow-sm hover:bg-accent/90"
                >
                  {isLoading ? 'Cargando...' : 'Iniciar Sesión con Google'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
