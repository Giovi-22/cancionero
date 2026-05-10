'use client';

import { CacheService } from './CacheService';
import { Song } from '@/types/drive';

export class SyncService {
  private static isSyncing = false;

  /**
   * Sincroniza el repertorio completo de forma incremental.
   * @param folderId ID de la carpeta de Drive (opcional)
   */
  public static async syncFullRepertoire(folderId?: string) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      console.log('Iniciando sincronización incremental...');
      
      // 1. Obtener la lista de canciones desde la API
      const url = folderId 
        ? `/api/drive/songs?folderId=${folderId}`
        : '/api/drive/songs';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al obtener lista de Drive');
      const data = await response.json();
      const remoteSongs: Song[] = data.songs;

      // 2. Guardar el nuevo índice (repertorio) en caché
      await CacheService.saveRepertoire(folderId || 'root', remoteSongs);

      // 3. Identificar canciones que necesitan actualizarse
      const songsToDownload: Song[] = [];

      for (const remoteSong of remoteSongs) {
        // Solo intentamos cachear Google Docs (formato nativo)
        if (remoteSong.mimeType !== 'application/vnd.google-apps.document') continue;

        const localMeta = await CacheService.getSongMetadata(remoteSong.id);
        
        // Si no existe localmente O la fecha de modificación en Drive es distinta/posterior
        if (!localMeta || localMeta.lastModified !== remoteSong.modifiedTime) {
          songsToDownload.push(remoteSong);
        }
      }

      console.log(`Sincronización: ${songsToDownload.length} canciones nuevas o modificadas de ${remoteSongs.length} totales.`);

      // 4. Descargar canciones en lotes para no saturar
      if (songsToDownload.length > 0) {
        await this.downloadSongsInBatches(songsToDownload, folderId);
      }

      console.log('Sincronización completada con éxito.');
    } catch (error) {
      console.error('Error durante la sincronización:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Descarga canciones en lotes pequeños
   */
  private static async downloadSongsInBatches(songs: Song[], folderId?: string) {
    const BATCH_SIZE = 5;
    for (let i = 0; i < songs.length; i += BATCH_SIZE) {
      const batch = songs.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(song => this.downloadAndCacheSong(song, folderId)));
    }
  }

  /**
   * Descarga una sola canción y la guarda en caché
   */
  private static async downloadAndCacheSong(song: Song, folderId?: string) {
    try {
      const url = folderId 
        ? `/api/drive/song/${song.id}?folderId=${folderId}`
        : `/api/drive/song/${song.id}`;
      
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.content) {
        await CacheService.saveSongContent(song.id, data.content, song.modifiedTime);
      }
    } catch (e) {
      // Ignorar fallos individuales
    }
  }

  /**
   * Pre-carga una lista de canciones específicas en el caché.
   * Útil para cuando se inicia un show y queremos asegurar que todo el setlist esté offline.
   */
  public static async prefetchSongs(songIds: string[], folderId?: string) {
    try {
      // 1. Obtener el repertorio (índice) para tener la metadata (modifiedTime, etc)
      const repertoire = await CacheService.getRepertoire(folderId || 'root');
      if (!repertoire) return;

      // 2. Filtrar solo las canciones que están en la lista y son documentos de Google
      const songsToPrefetch = repertoire.filter(s => 
        songIds.includes(s.id) && 
        s.mimeType === 'application/vnd.google-apps.document'
      );

      // 3. Descargar las que falten o estén viejas (usamos el método de descarga por lotes que ya existe)
      const songsToDownload: Song[] = [];
      for (const song of songsToPrefetch) {
        const localMeta = await CacheService.getSongMetadata(song.id);
        if (!localMeta || localMeta.lastModified !== song.modifiedTime) {
          songsToDownload.push(song);
        }
      }

      if (songsToDownload.length > 0) {
        console.log(`Prefetching ${songsToDownload.length} songs for live show...`);
        await this.downloadSongsInBatches(songsToDownload, folderId);
      }
    } catch (error) {
      console.warn('Error en prefetchSongs:', error);
    }
  }
}
