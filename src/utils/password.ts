// Web Crypto API password hashing utility for Zish-Gallery

const STORAGE_KEY_HASH = 'zish_gallery_pwd_hash';
const STORAGE_KEY_SALT = 'zish_gallery_pwd_salt';
const STORAGE_KEY_CUSTOMIZED = 'zish_gallery_pwd_customized';
export const DEFAULT_PASSWORD = 'Hajmola';

/**
 * Generate a cryptographically secure random salt hex string
 */
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a password with a salt using Web Crypto API (SHA-256)
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieve the stored password config or initialize default
 */
export async function getOrInitPasswordConfig(): Promise<{ hash: string; salt: string; isCustomized: boolean }> {
  let hash = localStorage.getItem(STORAGE_KEY_HASH);
  let salt = localStorage.getItem(STORAGE_KEY_SALT);
  const isCustomized = localStorage.getItem(STORAGE_KEY_CUSTOMIZED) === 'true';

  if (!hash || !salt) {
    salt = generateSalt();
    hash = await hashPassword(DEFAULT_PASSWORD, salt);
    localStorage.setItem(STORAGE_KEY_HASH, hash);
    localStorage.setItem(STORAGE_KEY_SALT, salt);
    localStorage.setItem(STORAGE_KEY_CUSTOMIZED, 'false');
  }

  return { hash, salt, isCustomized };
}

/**
 * Verify an input password against stored salt and hash
 */
export async function verifyPassword(inputPassword: string): Promise<boolean> {
  const { hash, salt } = await getOrInitPasswordConfig();
  const inputHash = await hashPassword(inputPassword, salt);
  return inputHash === hash;
}

/**
 * Update the master password
 */
export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const isValidCurrent = await verifyPassword(currentPassword);
  if (!isValidCurrent) {
    return { success: false, error: 'Current password is incorrect' };
  }

  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters long' };
  }

  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);

  localStorage.setItem(STORAGE_KEY_HASH, newHash);
  localStorage.setItem(STORAGE_KEY_SALT, newSalt);
  localStorage.setItem(STORAGE_KEY_CUSTOMIZED, 'true');

  return { success: true };
}

/**
 * Reset password back to default 'zish2026'
 */
export async function resetPasswordToDefault(): Promise<void> {
  const salt = generateSalt();
  const hash = await hashPassword(DEFAULT_PASSWORD, salt);
  localStorage.setItem(STORAGE_KEY_HASH, hash);
  localStorage.setItem(STORAGE_KEY_SALT, salt);
  localStorage.setItem(STORAGE_KEY_CUSTOMIZED, 'false');
}
