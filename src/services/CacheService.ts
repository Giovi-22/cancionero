'use client';

/**
 * Servicio para manejar el almacenamiento en caché local (offline)
 * Usamos sessionStorage para mantenerlo simple y persistente durante la sesión.
 * También podría migrarse a IndexedDB si se requiere guardar mucho texto entre sesiones.
 */
export class CacheService {
  private static PREFIX = 'cancionero_song_cache_';

  /**
   * Guarda el contenido de una canción en la caché
   */
  public static saveSongContent(songId: string, content: string) {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(`${this.PREFIX}${songId}`, content);
    } catch (e) {
      console.warn('No se pudo guardar la canción en caché:', e);
    }
  }

  /**
   * Obtiene el contenido de una canción desde la caché
   */
  public static getSongContent(songId: string): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(`${this.PREFIX}${songId}`);
  }

  /**
   * Pre-descarga una lista de canciones para que estén disponibles offline
   */
  public static async prefetchSongs(songIds: string[], folderId?: string) {
    if (typeof window === 'undefined') return;

    for (const id of songIds) {
      if (this.getSongContent(id)) {
        continue; // Ya está cacheado
      }

      try {
        const url = folderId 
          ? `/api/drive/song/${id}?folderId=${folderId}`
          : `/api/drive/song/${id}`;
          
        // Hacemos el request en background
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error('Error fetching song');
            return res.json();
          })
          .then(data => {
            if (data.content) {
              this.saveSongContent(id, data.content);
            }
          })
          .catch(err => console.error(`Error prefetching song ${id}:`, err));
          
      } catch (e) {
        // Ignoramos errores de red en el prefetch
      }
    }
  }
}
