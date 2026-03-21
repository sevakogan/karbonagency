import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) throw new Error('CREDENTIAL_ENCRYPTION_KEY is not set');
  return Buffer.from(key, 'hex');
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(stored: string): string {
  if (!stored || !stored.includes(':')) return '';
  const [ivB64, tagB64, dataB64] = stored.split(':');
  if (!ivB64 || !tagB64 || !dataB64) return '';
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function encryptCredentials(credentials: Record<string, string>): Record<string, string> {
  const encrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(credentials)) {
    encrypted[key] = value ? encrypt(value) : '';
  }
  return encrypted;
}

export function decryptCredentials(encrypted: Record<string, string>): Record<string, string> {
  const decrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(encrypted)) {
    decrypted[key] = value ? decrypt(value) : '';
  }
  return decrypted;
}
