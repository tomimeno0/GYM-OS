import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const rootDir = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(rootDir, '.env'), quiet: true });
const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name}. Ejecutá npm run setup y revisá .env.`);
  return value;
};
const hexKey = (name) => {
  const value = required(name);
  if (!/^[a-f\d]{64}$/i.test(value))
    throw new Error(`${name} debe contener 32 bytes en hexadecimal.`);
  return Buffer.from(value, 'hex');
};
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  origin: process.env.APP_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    name: process.env.DB_NAME || 'gym_os',
    user: process.env.DB_USER || 'gymos',
    password: required('DB_PASSWORD'),
  },
  encryptionKey: hexKey('ENCRYPTION_KEY'),
  integrityKey: hexKey('INTEGRITY_KEY'),
  ai: {
    provider: process.env.AI_PROVIDER || 'cohere',
    apiKey: process.env.COHERE_API_KEY || '',
    model: process.env.COHERE_MODEL || 'command-a-plus-05-2026',
    mock: process.env.AI_MOCK === 'true',
  },
};
if (env.nodeEnv === 'production' && !env.origin.startsWith('https://'))
  throw new Error('Producción requiere APP_ORIGIN con HTTPS.');
