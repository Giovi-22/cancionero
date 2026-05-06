export interface Song {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

export interface DriveFolderContent {
  songs: Song[];
  nextPageToken?: string | null;
}
