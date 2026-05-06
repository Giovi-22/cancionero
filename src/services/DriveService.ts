import { google } from 'googleapis';
import { Song, DriveFolderContent } from '@/types/drive';

export class DriveService {
  private static instance: DriveService;
  
  private constructor() {}

  public static getInstance(): DriveService {
    if (!DriveService.instance) {
      DriveService.instance = new DriveService();
    }
    return DriveService.instance;
  }

  private getDriveClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.drive({ version: 'v3', auth });
  }

  /**
   * Obtiene recursivamente todos los IDs de las subcarpetas
   */
  private async getAllSubfolderIds(accessToken: string, rootFolderId: string): Promise<string[]> {
    const drive = this.getDriveClient(accessToken);
    const folderIds: string[] = [rootFolderId];
    
    // Cola para búsqueda por niveles (BFS)
    const queue = [rootFolderId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      try {
        const response = await drive.files.list({
          q: `'${currentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: 'files(id)',
        });
        
        const subfolders = response.data.files || [];
        for (const folder of subfolders) {
          if (folder.id) {
            folderIds.push(folder.id);
            queue.push(folder.id);
          }
        }
      } catch (error) {
        console.error(`Error fetching subfolders for ${currentId}:`, error);
      }
    }
    
    return folderIds;
  }

  /**
   * Obtiene el listado de archivos (PDF y Google Docs) de una carpeta y sus subcarpetas
   */
  public async getSongsFromFolder(accessToken: string, rootFolderId: string): Promise<DriveFolderContent> {
    const drive = this.getDriveClient(accessToken);
    
    try {
      // 1. Obtener todos los IDs de las subcarpetas para búsqueda exhaustiva
      const allFolderIds = await this.getAllSubfolderIds(accessToken, rootFolderId);
      
      // 2. Construir el query para buscar en múltiples padres
      // Nota: Si hay demasiadas carpetas, el query puede fallar por longitud. 
      // Si eso pasa, buscaremos de otra forma.
      const parentQuery = allFolderIds.map(id => `'${id}' in parents`).join(' or ');
      
      const response = await drive.files.list({
        q: `(${parentQuery}) and (mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.document') and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime)',
        orderBy: 'name',
        pageSize: 100,
      });

      const files = response.data.files || [];
      
      const songs: Song[] = files.map((file) => ({
        id: file.id || '',
        name: file.name || 'Sin título',
        mimeType: file.mimeType || '',
        webViewLink: file.webViewLink || undefined,
        thumbnailLink: file.thumbnailLink || undefined,
        modifiedTime: file.modifiedTime || undefined,
      }));

      return {
        songs,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error('Error fetching songs from Drive:', error);
      throw new Error('No se pudieron obtener las canciones de Google Drive.');
    }
  }

  /**
   * Obtiene los detalles de una canción por su ID
   */
  public async getSongDetails(accessToken: string, fileId: string): Promise<Song> {
    const drive = this.getDriveClient(accessToken);
    try {
      const response = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, webViewLink, thumbnailLink, modifiedTime',
      });

      const file = response.data;
      return {
        id: file.id || '',
        name: file.name || 'Sin título',
        mimeType: file.mimeType || '',
        webViewLink: file.webViewLink || undefined,
        thumbnailLink: file.thumbnailLink || undefined,
        modifiedTime: file.modifiedTime || undefined,
      };
    } catch (error) {
      console.error(`Error fetching song details for ${fileId}:`, error);
      throw new Error('No se pudo obtener la información de la canción.');
    }
  }
}

export const driveService = DriveService.getInstance();
