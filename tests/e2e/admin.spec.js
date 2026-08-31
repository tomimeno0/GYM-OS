import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
const headers = { 'X-GymOS-Client': 'web' },
  password = 'Usuario temporal 2026!';
test('administrator manages roles and accounts, reads audit and verifies integrity', async ({
  page,
  request,
}) => {
  const email = `managed-${randomUUID()}@gym-os.test`,
    roleName = `Lectura ${randomUUID().slice(0, 8)}`;
  const created = await request.post('/api/v1/auth/register', {
    headers,
    data: { nombre: 'Usuario QA', email, password },
  });
  expect(created.status()).toBe(201);
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('admin@gym-os.demo');
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto('/admin/roles');
  await page.getByRole('button', { name: 'Crear rol', exact: true }).click();
  await page.getByLabel('Nombre del rol', { exact: true }).fill(roleName);
  await page.getByLabel('Consultar usuarios', { exact: true }).check();
  await page.getByRole('button', { name: 'Guardar rol' }).click();
  await expect(page.getByRole('heading', { name: roleName, exact: true })).toBeVisible();
  await page.goto('/admin/usuarios');
  await page.getByLabel('Buscar usuarios', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();
  await page
    .getByRole('row')
    .filter({ hasText: email })
    .getByRole('button', { name: 'Roles', exact: true })
    .click();
  await page.getByRole('dialog').getByLabel(roleName, { exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar roles' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: email })).toContainText(roleName);
  await page
    .getByRole('row')
    .filter({ hasText: email })
    .getByRole('button', { name: 'Bloquear', exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('row').filter({ hasText: email })).toContainText('Bloqueado');
  const denied = await request.post('/api/v1/auth/login', { headers, data: { email, password } });
  expect(denied.status()).toBe(401);
  await page
    .getByRole('row')
    .filter({ hasText: email })
    .getByRole('button', { name: 'Activar', exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: `Eliminar usuario ${email}`, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No hay coincidencias' })).toBeVisible();
  await page.goto('/admin/roles');
  const role = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: roleName, exact: true }) });
  await role.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Descripción', { exact: true }).fill('Rol verificado en navegador');
  await page.getByRole('button', { name: 'Guardar rol' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(role).toContainText('Rol verificado en navegador');
  await role.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: roleName, exact: true })).toHaveCount(0);
  await page.goto('/admin/bitacora');
  await expect(
    page.getByRole('cell', { name: 'CU036_ELIMINAR_ROL', exact: true }).first(),
  ).toBeVisible();
  await page.goto('/admin/integridad');
  await expect(
    page.getByRole('heading', { name: 'Integridad verificada', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: 'usuarios', exact: true })).toBeVisible();
});
