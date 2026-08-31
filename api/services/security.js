import { scrypt as scryptCallback, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv, createHmac, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
const scrypt = promisify(scryptCallback);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64, options);
  return `scrypt$32768$8$1$${salt}$${hash.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const parts = String(encoded).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const hash = await scrypt(password, parts[4], 64, options);
  const expected = Buffer.from(parts[5], 'hex');
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}
export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = value => createHash('sha256').update(value).digest('hex');
export function encrypt(value) {
  if (!value) return null;
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', env.encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(v => v.toString('base64url')).join('.');
}
export function decrypt(value) {
  if (!value) return '';
  const [iv, tag, data] = value.split('.').map(v => Buffer.from(v, 'base64url'));
  const cipher = createDecipheriv('aes-256-gcm', env.encryptionKey, iv); cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
}
function normalize(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, normalize(value[k])]));
  return value;
}
export function signature(value) { return createHmac('sha256', env.integrityKey).update(JSON.stringify(normalize(value))).digest('hex'); }
