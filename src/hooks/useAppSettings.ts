'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

export interface AppSettings {
  driveFolderId: string;
}

export function useAppSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<AppSettings>({ driveFolderId: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      // 1. Try local storage first
      const localSettings = localStorage.getItem('cancionero_settings');
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          setSettings(parsed);
        } catch (e) {}
      }

      // 2. Fetch from Supabase if logged in
      if (session?.user?.email) {
        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('drive_folder_id')
            .eq('user_email', session.user.email)
            .maybeSingle();

          if (data && data.drive_folder_id) {
            const newSettings = { driveFolderId: data.drive_folder_id };
            setSettings(newSettings);
            localStorage.setItem('cancionero_settings', JSON.stringify(newSettings));
          }
        } catch (e) {
          // Table might not exist yet, ignore
          console.warn('Error fetching settings from supabase (table might not exist):', e);
        }
      }
      setIsLoading(false);
    };

    loadSettings();
  }, [session]);

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
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_email' });
      } catch (e) {
        console.warn('Error saving settings to supabase:', e);
      }
    }
  };

  return { settings, saveSettings, isLoading };
}
