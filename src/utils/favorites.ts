// LocalStorage Favorites Manager

const FAVORITES_STORAGE_KEY = 'zish_gallery_favorites';

export function getFavoriteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function toggleFavoriteId(id: string): boolean {
  const current = getFavoriteIds();
  let isNowFav = false;
  if (current.has(id)) {
    current.delete(id);
    isNowFav = false;
  } else {
    current.add(id);
    isNowFav = true;
  }
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(current)));
  return isNowFav;
}

export function clearFavorites(): void {
  localStorage.removeItem(FAVORITES_STORAGE_KEY);
}
