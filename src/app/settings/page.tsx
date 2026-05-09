'use client'

import { useState, useEffect } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { settings, saveSettings, isLoading } = useAppSettings();
  const [folderIdInput, setFolderIdInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      setFolderIdInput(settings.driveFolderId);
    }
  }, [settings.driveFolderId, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    // Extract ID if user pasted a full URL
    let finalId = folderIdInput.trim();
    if (finalId.includes('folders/')) {
      finalId = finalId.split('folders/')[1].split('?')[0];
    } else if (finalId.includes('id=')) {
      finalId = finalId.split('id=')[1].split('&')[0];
    }

    await saveSettings({ driveFolderId: finalId });
    
    // Clear cache so it forces a reload of the songs with the new folder
    sessionStorage.removeItem(`cancionero_full_repertoire_${finalId}`);
    
    setIsSaving(false);
    setSuccess(true);
    setTimeout(() => {
      router.push('/songs');
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Configuración
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Ajustes generales de la aplicación.
        </p>
      </header>

      <div className="bg-background rounded-2xl border border-muted p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="folderId" className="block text-sm font-bold text-foreground mb-2">
              Carpeta de Google Drive
            </label>
            <p className="text-sm text-muted-foreground mb-4">
              Pega el ID o el link (URL) completo de la carpeta de Google Drive de donde querés que se lean las canciones.
            </p>
            <input
              id="folderId"
              type="text"
              value={folderIdInput}
              onChange={(e) => setFolderIdInput(e.target.value)}
              placeholder="Ej: 1A2b3C4d5E6f7G8h9I0j..."
              className="w-full rounded-xl border border-muted bg-muted/30 px-4 py-3 text-foreground placeholder-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-accent px-8 py-3 text-sm font-bold text-white transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar y Sincronizar'}
            </button>

            {success && (
              <span className="text-green-500 font-bold text-sm animate-in fade-in">
                ¡Guardado exitosamente!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
