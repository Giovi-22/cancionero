'use client';

import { useState, useEffect } from 'react';
import NativeSongViewer from './NativeSongViewer';
import { CacheService } from '@/services/CacheService';
import Link from 'next/link';

export default function OfflineSongViewer({ id }: { id: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar leer de caché
    const cachedContent = CacheService.getSongContent(id);
    if (cachedContent) {
      setContent(cachedContent);
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-8 text-white">Cargando modo offline...</div>;
  }

  if (!content) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-screen bg-black text-white">
        <h1 className="text-2xl font-bold text-red-500 mb-4">No hay conexión</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          No pudimos conectar con Google Drive y esta canción no está guardada en la caché offline del dispositivo.
        </p>
        <Link 
          href="/songs"
          className="rounded-full bg-accent px-8 py-3 text-sm font-bold text-white transition-all hover:bg-accent/90"
        >
          Volver al Repertorio
        </Link>
      </div>
    );
  }

  return <NativeSongViewer content={content} title="Canción Offline" id={id} />;
}
