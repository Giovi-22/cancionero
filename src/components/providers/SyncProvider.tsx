'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SyncService } from '@/services/SyncService'
import { useAppSettings } from '@/hooks/useAppSettings'

export default function SyncProvider() {
  const { data: session, status } = useSession()
  const { settings, isLoading: isSettingsLoading } = useAppSettings()

  useEffect(() => {
    // Consideramos autenticado solo si el status es ok Y no hay error de token
    const isAuthenticated = status === 'authenticated' && session && !session.error

    // Solo sincronizar automáticamente cuando el usuario está logueado
    // y las configuraciones de la carpeta de Drive están cargadas.
    if (isAuthenticated && !isSettingsLoading) {
      // Usar un timeout pequeño para no interferir con la carga inicial crítica
      const timer = setTimeout(() => {
        SyncService.syncFullRepertoire(settings.driveFolderId);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [status, isSettingsLoading, settings.driveFolderId]);

  return null;
}
