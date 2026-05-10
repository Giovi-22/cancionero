'use client';

/**
 * Servicio para manejar el almacenamiento en caché local persistente usando IndexedDB.
 */
const DB_NAME = 'CancioneroDB';
const DB_VERSION = 1;
const STORES = {
  SONGS: 'songs',
  METADATA: 'metadata'
};

export class CacheService {
  private static db: IDBDatabase | null = null;

  /**
   * Inicializa y abre la base de datos IndexedDB
   */
  private static async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Almacén para el contenido de las canciones
        if (!db.objectStoreNames.contains(STORES.SONGS)) {
          db.createObjectStore(STORES.SONGS, { keyPath: 'id' });
        }
        
        // Almacén para metadatos (ej. repertorio completo, última sincronización)
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Guarda el contenido de una canción en IndexedDB
   */
  public static async saveSongContent(songId: string, content: string, lastModified?: string) {
    if (typeof window === 'undefined') return;
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORES.SONGS, 'readwrite');
      const store = transaction.objectStore(STORES.SONGS);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          id: songId,
          content,
          lastModified,
          cachedAt: new Date().toISOString()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('No se pudo guardar la canción en IndexedDB:', e);
    }
  }

  /**
   * Obtiene el contenido de una canción desde IndexedDB
   */
  public static async getSongContent(songId: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORES.SONGS, 'readonly');
      const store = transaction.objectStore(STORES.SONGS);
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(songId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return result ? result.content : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Obtiene los metadatos de una canción (para comparar fechas)
   */
  public static async getSongMetadata(songId: string): Promise<any | null> {
    if (typeof window === 'undefined') return null;
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORES.SONGS, 'readonly');
      const store = transaction.objectStore(STORES.SONGS);
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(songId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return result || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Guarda la lista completa de canciones (el repertorio)
   */
  public static async saveRepertoire(folderId: string, songs: any[]) {
    if (typeof window === 'undefined') return;
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORES.METADATA, 'readwrite');
      const store = transaction.objectStore(STORES.METADATA);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          id: `repertoire_${folderId}`,
          songs,
          updatedAt: new Date().toISOString()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('No se pudo guardar el repertorio en IndexedDB:', e);
    }
  }

  /**
   * Obtiene la lista guardada de canciones
   */
  public static async getRepertoire(folderId: string): Promise<any[] | null> {
    if (typeof window === 'undefined') return null;
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORES.METADATA, 'readonly');
      const store = transaction.objectStore(STORES.METADATA);
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(`repertoire_${folderId}`);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return result ? result.songs : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Guarda los ajustes personalizados de una canción (transposición, capo, bpm, etc.)
   */
  public static async saveSongSettings(songId: string, settings: any) {
    if (typeof window === 'undefined') return;
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORES.METADATA, 'readwrite');
      const store = transaction.objectStore(STORES.METADATA);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          id: `settings_${songId}`,
          ...settings,
          updatedAt: new Date().toISOString()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('No se pudieron guardar los ajustes en IndexedDB:', e);
    }
  }

  /**
   * Obtiene los ajustes personalizados de una canción
   */
  public static async getSongSettings(songId: string): Promise<any | null> {
    if (typeof window === 'undefined') return null;
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORES.METADATA, 'readonly');
      const store = transaction.objectStore(STORES.METADATA);
      
      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(`settings_${songId}`);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return result || null;
    } catch (e) {
      return null;
    }
  }
}
