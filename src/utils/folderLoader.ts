import { MediaItem } from '../types';
import {
  loadPermanentVaultMedia,
  saveMediaToVault,
  deleteMediaFromVault,
  detectMediaType,
  getDeletedMediaIds,
  markMediaDeleted,
  restoreAllDeletedMedia,
  getDeletedCount,
} from './vaultStorage';

// Automatically glob all photos and videos inside the permanent src/photos folder and its subfolders
const bundledMediaModules = import.meta.glob<string>(
  [
    '/src/photos/*.{jpg,jpeg,png,webp,gif,avif,svg,mp4,webm,mov,ogg,m4v,mkv,JPG,JPEG,PNG,WEBP,GIF,AVIF,SVG,MP4,WEBM,MOV,OGG,M4V,MKV}',
    '/src/photos/**/*.{jpg,jpeg,png,webp,gif,avif,svg,mp4,webm,mov,ogg,m4v,mkv,JPG,JPEG,PNG,WEBP,GIF,AVIF,SVG,MP4,WEBM,MOV,OGG,M4V,MKV}',
  ],
  { eager: true, query: '?url', import: 'default' }
);

function extractDateFromFileName(fileName: string): number {
  // Try matching YYYYMMDD or YYYY-MM-DD or YYYY_MM_DD
  const match = fileName.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})(?:[-_]?(\d{2})[-_]?(\d{2})[-_]?(\d{2}))?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 12;
    const min = match[5] ? parseInt(match[5], 10) : 0;
    const sec = match[6] ? parseInt(match[6], 10) : 0;
    if (year >= 2000 && year <= 2035 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(year, month, day, hour, min, sec).getTime();
    }
  }
  return Date.now() - 86400000 * 2;
}

/**
 * Extract media from the permanent folder bundled with the application
 */
export function getPermanentFolderMedia(): MediaItem[] {
  const items: MediaItem[] = [];

  for (const [filePath, url] of Object.entries(bundledMediaModules)) {
    const fileName = filePath.split('/').pop() || 'media';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mediaType = detectMediaType(fileName);
    const safeId = 'folder_' + filePath.replace(/[^a-zA-Z0-9_-]/g, '_');
    const lastModified = extractDateFromFileName(fileName);

    items.push({
      id: safeId,
      name: fileName,
      relativePath: fileName,
      mediaType,
      extension: ext,
      size: mediaType === 'video' ? 1024 * 1024 * 3.5 : 1024 * 1024 * 1.2,
      lastModified,
      url,
    });
  }

  return items;
}

export const getPermanentFolderPhotos = getPermanentFolderMedia;

/**
 * Load all permanently accessible media:
 * 1. Media from the permanent `photos/` folder (minus deleted items)
 * 2. Media saved permanently in the browser's IndexedDB vault (minus deleted items)
 */
export async function loadAllPermanentMedia(): Promise<MediaItem[]> {
  const deletedIds = getDeletedMediaIds();
  const folderMedia = getPermanentFolderMedia().filter((m) => !deletedIds.has(m.id));
  const vaultMedia = (await loadPermanentVaultMedia()).filter((m) => !deletedIds.has(m.id));

  // Combine and deduplicate by id
  const map = new Map<string, MediaItem>();
  folderMedia.forEach((m) => map.set(m.id, m));
  vaultMedia.forEach((m) => map.set(m.id, m));

  return Array.from(map.values());
}

export const loadAllPermanentPhotos = loadAllPermanentMedia;

/**
 * Add images/videos permanently to the secure vault
 */
export async function addMediaToSecureVault(files: File[]): Promise<MediaItem[]> {
  return await saveMediaToVault(files);
}

export const addPhotosToSecureVault = addMediaToSecureVault;

/**
 * Delete media item from vault and persist the deletion permanently
 */
export async function removeMedia(id: string): Promise<void> {
  markMediaDeleted(id);
  if (id.startsWith('vault_')) {
    await deleteMediaFromVault(id);
  }
}

export const removePhoto = removeMedia;

/**
 * Restore all deleted items
 */
export function restoreDeletedMedia(): void {
  restoreAllDeletedMedia();
}

export { getDeletedCount };

