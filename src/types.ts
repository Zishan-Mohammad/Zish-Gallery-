export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  name: string;
  relativePath: string;
  mediaType: MediaType;
  folder?: string;
  extension: string;
  size: number;
  lastModified: number;
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  fileHandle?: FileSystemFileHandle;
  isFavorite?: boolean;
}

// Backwards-compatibility alias
export type PhotoItem = MediaItem;

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'date-newest'
  | 'date-oldest'
  | 'size-desc';

export type MediaTypeFilter = 'ALL' | 'PHOTOS' | 'VIDEOS';

export type FilterExtension =
  | 'ALL'
  | 'PHOTOS'
  | 'VIDEOS'
  | 'MP4'
  | 'WEBM'
  | 'MOV'
  | 'JPG'
  | 'PNG'
  | 'WEBP'
  | 'GIF'
  | 'AVIF'
  | 'SVG';

export type GridDensity = 'compact' | 'comfortable' | 'large';

export type ThemeMode = 'dark' | 'light';

export interface GallerySettings {
  theme: ThemeMode;
  density: GridDensity;
  defaultSort: SortOption;
  inactivityTimeoutMinutes: number; // 0 = off, 5, 10, 15, 30
  showMetadataOverlay: boolean;
}
