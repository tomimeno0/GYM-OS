import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const headers = { 'X-GymOS-Client': 'web' };
test('password recovery and confirmed logout use real local delivery and revoke old credentials', async ({
  page,
  request,
}) => {
  const email = `recovery-${randomUUID()}@gym-os.test`,
    password = 'Anterior de prueba 2026!',
    nextPassword = 'Nueva de prueba 2026!';
  expect(
    (
      await request.post('/api/v1/auth/register', {
        headers,
        data: { nombre: 'Recuperación', email, password },
      })
    ).status(),
  ).toBe(201);
  await page.goto('/recuperar');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByRole('status')).toContainText('recibirás un enlace');
  let url;
  for (const file of await readdir('.local/mail')) {
    if (!file.endsWith('.json')) continue;
    const mail = JSON.parse(await readFile(path.join('.local/mail', file), 'utf8'));
    if (mail.to === email) url = mail.text.match(/http\S+/)?.[0];
  }
  expect(url).toBeTruthy();
  await page.goto(url);
  await page.getByLabel('Contraseña', { exact: true }).fill(nextPassword);
  await page.getByLabel('Repetir contraseña', { exact: true }).fill(nextPassword);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.getByRole('status')).toContainText('Contraseña actualizada');
  expect(
    (await request.post('/api/v1/auth/login', { headers, data: { email, password } })).status(),
  ).toBe(401);
  await page.getByRole('link', { name: 'Volver a iniciar sesión' }).click();
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(nextPassword);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: /Recuperación Cerrar sesión/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole('button', { name: /Recuperación Cerrar sesión/ }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
  await page.goto(url);
  await page.getByLabel('Contraseña', { exact: true }).fill('Otro intento seguro 2026!');
  await page.getByLabel('Repetir contraseña', { exact: true }).fill('Otro intento seguro 2026!');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.getByRole('alert')).toContainText('no es válido o venció');
  expect(
    (
      await request.post('/api/v1/auth/login', { headers, data: { email, password: nextPassword } })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.delete('/api/v1/me', {
        headers,
        data: { confirmar: true, password: nextPassword },
      })
    ).status(),
  ).toBe(204);
});
