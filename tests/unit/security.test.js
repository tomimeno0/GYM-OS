import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  hashToken,
  newToken,
  signature,
} from '../../api/services/security.js';
import { registerSchema, measurementSchema } from '@gym-os/shared/schemas';

test('password hashing uses unique salts and rejects the wrong password', async () => {
  const a = await hashPassword('Una contraseña de prueba 2026'),
    b = await hashPassword('Una contraseña de prueba 2026');
  assert.notEqual(a, b);
  assert.equal(await verifyPassword('Una contraseña de prueba 2026', a), true);
  assert.equal(await verifyPassword('incorrecta', a), false);
  assert.equal(await verifyPassword('x', 'corrupt'), false);
});
test('reversible encryption authenticates ciphertext and uses a fresh nonce', () => {
  const a = encrypt('+54 11 1234 5678'),
    b = encrypt('+54 11 1234 5678');
  assert.notEqual(a, b);
  assert.equal(decrypt(a), '+54 11 1234 5678');
  assert.equal(decrypt(null), '');
  const parts = a.split('.');
  parts[1] = Buffer.alloc(16).toString('base64url');
  assert.throws(() => decrypt(parts.join('.')));
});
test('integrity signature is key-order independent and detects nested modifications', () => {
  assert.equal(signature({ a: 1, b: { x: 2, y: 3 } }), signature({ b: { y: 3, x: 2 }, a: 1 }));
  assert.notEqual(signature({ a: [1, 2] }), signature({ a: [2, 1] }));
  const token = newToken();
  assert.equal(token.length, 43);
  assert.equal(hashToken(token).length, 64);
  assert.notEqual(hashToken(token), token);
});
test('schemas reject privilege injection, invalid physical ranges and impossible totals', () => {
  assert.equal(
    registerSchema.safeParse({
      nombre: 'Alex',
      email: 'alex@example.test',
      password: '1234567890',
      roles: ['Administrador'],
    }).success,
    false,
  );
  assert.equal(
    measurementSchema.safeParse({ peso_kg: -1, altura_cm: 170, nivel_actividad: 'media' }).success,
    false,
  );
  assert.equal(
    measurementSchema.safeParse({
      peso_kg: 70,
      altura_cm: 170,
      nivel_actividad: 'media',
      grasa_corporal: 60,
      musculo_corporal: 60,
    }).success,
    false,
  );
});
