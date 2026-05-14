'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

export interface AppSettings {
  driveFolderId: string;
  pedalScrollSpeed: number;
}

export function useAppSettings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<AppSettings>({ 
    driveFolderId: '',
    pedalScrollSpeed: 0.2
  });
  const [isLoading, setIsLoading] = useState(true);

  // 1. Cargar de localStorage inmediatamente al montar
  useEffect(() => {
    const localSettings = localStorage.getItem('cancionero_settings');
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        setSettings(parsed);
      } catch (e) {}
    }
    // Si ya cargamos de localStorage, podemos dejar de mostrar el spinner inicial 
    // y dejar que Supabase actualice en segundo plano si hay red.
    setIsLoading(false);
  }, []);

  // 2. Sincronizar con Supabase cuando cambie la sesión o el estado
  useEffect(() => {
    const syncWithSupabase = async () => {
      if (status !== 'authenticated' || !session?.user?.email) return;

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('drive_folder_id, pedal_scroll_speed')
          .eq('user_email', session.user.email)
          .maybeSingle();

        if (data) {
          const newSettings = { 
            driveFolderId: data.drive_folder_id,
            pedalScrollSpeed: data.pedal_scroll_speed || 0.2
          };
          setSettings(newSettings);
          localStorage.setItem('cancionero_settings', JSON.stringify(newSettings));
        }
      } catch (e) {
        console.warn('Error al sincronizar ajustes con Supabase (posiblemente offline):', e);
      }
    };

    if (status !== 'loading') {
      syncWithSupabase();
    }
  }, [session, status]);

  const saveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('cancionero_settings', JSON.stringify(newSettings));

    if (session?.user?.email) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_email: session.user.email,
            drive_folder_id: newSettings.driveFolderId,
            pedal_scroll_speed: newSettings.pedalScrollSpeed,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_email' });
      } catch (e) {
        console.warn('Error al guardar ajustes en Supabase:', e);
      }
    }
  };

  return { settings, saveSettings, isLoading };
}
