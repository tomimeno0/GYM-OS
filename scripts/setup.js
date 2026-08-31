import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (existsSync('.env')) {
  console.log('.env ya existe; no se modificaron tus claves.');
} else {
  let env = readFileSync('.env.example', 'utf8');
  for (const key of ['DB_PASSWORD', 'MYSQL_ROOT_PASSWORD', 'ENCRYPTION_KEY', 'INTEGRITY_KEY']) {
    env = env.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${randomBytes(32).toString('hex')}`);
  }
  env = env.replace(/^DEMO_PASSWORD=.*$/m, `DEMO_PASSWORD=${randomBytes(18).toString('base64url')}`);
  writeFileSync('.env', env, { mode: 0o600, flag: 'wx' });
  console.log('.env creado con claves aleatorias. No compartir ni subir a Git.');
}
