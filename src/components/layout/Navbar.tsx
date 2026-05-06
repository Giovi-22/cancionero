'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-muted bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image
                src="/icon-512x512.png"
                alt="Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Cancionero<span className="text-accent">Pro</span>
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80">
            Mi Repertorio
          </button>
          <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
             <span className="text-accent text-xs font-bold">G</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
