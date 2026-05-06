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
   * Obtiene el listado de archivos (PDF y Google Docs) de una carpeta específica
   */
  public async getSongsFromFolder(accessToken: string, folderId: string): Promise<DriveFolderContent> {
    const drive = this.getDriveClient(accessToken);
    
    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and (mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.document') and trashed = false`,
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
}

export const driveService = DriveService.getInstance();
