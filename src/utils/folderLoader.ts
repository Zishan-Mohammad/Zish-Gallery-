import { MediaItem } from '../types';
import {
  loadPermanentVaultMedia,
  saveMediaToVault,
  deleteMediaFromVault,
  detectMediaType,
} from './vaultStorage';

// Automatically glob all photos and videos inside the permanent src/photos folder
const bundledMediaModules = import.meta.glob<string>(
  '/src/photos/**/*.{jpg,jpeg,png,webp,gif,avif,svg,mp4,webm,mov,ogg,m4v,mkv,JPG,JPEG,PNG,WEBP,GIF,AVIF,SVG,MP4,WEBM,MOV,OGG,M4V,MKV}',
  { eager: true, query: '?url', import: 'default' }
);

/**
 * Extract media from the permanent folder bundled with the application
 */
export function getPermanentFolderMedia(): MediaItem[] {
  const items: MediaItem[] = [];

  for (const [filePath, url] of Object.entries(bundledMediaModules)) {
    // filePath is e.g. "/src/photos/sample_timelapse.mp4"
    const fileName = filePath.split('/').pop() || 'media';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mediaType = detectMediaType(fileName);

    items.push({
      id: `folder_${fileName}`,
      name: fileName,
      relativePath: fileName,
      mediaType,
      extension: ext,
      size: mediaType === 'video' ? 1024 * 1024 * 4.2 : 1024 * 1024 * 1.5,
      lastModified: Date.now() - 86400000 * 2,
      url,
    });
  }

  return items;
}

export const getPermanentFolderPhotos = getPermanentFolderMedia;

/**
 * Load all permanently accessible media:
 * 1. Media from the permanent `photos/` folder
 * 2. Media saved permanently in the browser's IndexedDB vault
 */
export async function loadAllPermanentMedia(): Promise<MediaItem[]> {
  const folderMedia = getPermanentFolderMedia();
  const vaultMedia = await loadPermanentVaultMedia();

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
 * Delete media item from vault if it's user-stored
 */
export async function removeMedia(id: string): Promise<void> {
  if (id.startsWith('vault_')) {
    await deleteMediaFromVault(id);
  }
}

export const removePhoto = removeMedia;
