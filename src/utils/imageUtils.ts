import { PhotoItem, SortOption } from '../types';

// Track active Object URLs to prevent memory leaks
const activeObjectUrls = new Set<string>();

export function registerObjectUrl(url: string): string {
  activeObjectUrls.add(url);
  return url;
}

export function revokeObjectUrl(url: string): void {
  if (activeObjectUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
    activeObjectUrls.delete(url);
  }
}

export function revokeAllObjectUrls(): void {
  activeObjectUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  });
  activeObjectUrls.clear();
}

/**
 * Human-readable byte formatting
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format timestamp to localized date string
 */
export function formatDate(timestamp: number): string {
  if (!timestamp) return 'Unknown Date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/**
 * Natural comparison function for sorting photos
 */
export function comparePhotos(a: PhotoItem, b: PhotoItem, sortOption: SortOption): number {
  switch (sortOption) {
    case 'name-asc':
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    case 'name-desc':
      return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
    case 'date-newest':
      return (b.lastModified || 0) - (a.lastModified || 0);
    case 'date-oldest':
      return (a.lastModified || 0) - (b.lastModified || 0);
    case 'size-desc':
      return (b.size || 0) - (a.size || 0);
    default:
      return 0;
  }
}

/**
 * Helper to inspect image natural width and height
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}
