import { PhotoItem } from '../types';
import { loadPermanentVaultPhotos, savePhotosToVault, deletePhotoFromVault } from './vaultStorage';

// Automatically glob all images inside the permanent src/photos folder!
// Supported extensions: jpg, jpeg, png, webp, gif, avif, svg
const bundledPhotoModules = import.meta.glob<string>(
  '/src/photos/**/*.{jpg,jpeg,png,webp,gif,avif,svg,JPG,JPEG,PNG,WEBP,GIF,AVIF,SVG}',
  { eager: true, query: '?url', import: 'default' }
);

/**
 * Extract photos from the permanent folder bundled with the application
 */
export function getPermanentFolderPhotos(): PhotoItem[] {
  const items: PhotoItem[] = [];

  for (const [filePath, url] of Object.entries(bundledPhotoModules)) {
    // filePath is e.g. "/src/photos/Vacation/tropical_beach.svg"
    const cleanedPath = filePath.replace('/src/photos/', '');
    const pathParts = cleanedPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folder = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Permanent';
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';

    items.push({
      id: `folder_${cleanedPath}`,
      name: fileName,
      relativePath: cleanedPath,
      folder: folder,
      extension: ext,
      size: 1024 * 1024 * 1.5, // approximate placeholder size
      lastModified: Date.now() - 86400000 * 3,
      url: url,
    });
  }

  return items;
}

/**
 * Load all permanently accessible photos:
 * 1. Photos from the permanent `photos/` folder
 * 2. Photos saved permanently in the browser's IndexedDB vault
 */
export async function loadAllPermanentPhotos(): Promise<PhotoItem[]> {
  const folderPhotos = getPermanentFolderPhotos();
  const vaultPhotos = await loadPermanentVaultPhotos();

  // Combine and deduplicate by relativePath / id
  const map = new Map<string, PhotoItem>();
  folderPhotos.forEach((p) => map.set(p.id, p));
  vaultPhotos.forEach((p) => map.set(p.id, p));

  return Array.from(map.values());
}

/**
 * Add images permanently to the secure vault
 */
export async function addPhotosToSecureVault(
  files: File[],
  defaultFolder = 'Vault'
): Promise<PhotoItem[]> {
  return await savePhotosToVault(files, defaultFolder);
}

/**
 * Delete photo from vault if it's user-stored
 */
export async function removePhoto(id: string): Promise<void> {
  if (id.startsWith('vault_')) {
    await deletePhotoFromVault(id);
  }
}
