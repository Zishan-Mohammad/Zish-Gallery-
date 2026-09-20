export interface PhotoItem {
  id: string;
  name: string;
  relativePath: string;
  folder: string;
  extension: string;
  size: number;
  lastModified: number;
  url: string;
  width?: number;
  height?: number;
  fileHandle?: FileSystemFileHandle;
  isFavorite?: boolean;
}

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'date-newest'
  | 'date-oldest'
  | 'size-desc';

export type FilterExtension = 'ALL' | 'JPG' | 'PNG' | 'WEBP' | 'GIF' | 'AVIF';

export type GridDensity = 'compact' | 'comfortable' | 'large';

export type ThemeMode = 'dark' | 'light';

export interface GallerySettings {
  theme: ThemeMode;
  density: GridDensity;
  includeSubfolders: boolean;
  defaultSort: SortOption;
  inactivityTimeoutMinutes: number; // 0 = off, 5, 10, 15, 30
  showMetadataOverlay: boolean;
}
