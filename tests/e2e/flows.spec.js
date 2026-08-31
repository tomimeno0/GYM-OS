import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const password = 'Prueba de interfaz 2026!';
async function go(page, path) {
  await page.goto(path);
  await expect(page.locator('h1')).toBeVisible();
}
async function fill(page, label, value) {
  await page.getByLabel(label, { exact: true }).fill(String(value));
}
test('full manual journey: registration, measurements, goal, routine, workout, nutrition, profile and account deletion', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const email = `e2e-${randomUUID()}@gym-os.test`;
  await go(page, '/registro');
  await fill(page, 'Nombre', 'Lucía');
  await fill(page, 'Apellido', 'Prueba');
  await fill(page, 'Correo electrónico', email);
  await fill(page, 'Contraseña', password);
  await fill(page, 'Repetir contraseña', password);
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { name: 'Vamos de nuevo, Lucía.' })).toBeVisible();
  await go(page, '/progreso');
  await page.getByRole('button', { name: 'Registrar medidas' }).click();
  await fill(page, 'Peso (kg)', 80);
  await fill(page, 'Altura (cm)', 175);
  await fill(page, 'Grasa corporal (%)', 23);
  await page.getByRole('button', { name: 'Guardar medición' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: '80', exact: true })).toBeVisible();
  await go(page, '/objetivos');
  await page.getByRole('button', { name: 'Nuevo objetivo' }).click();
  await fill(page, 'Nombre del objetivo', 'Mi objetivo real');
  await fill(page, 'Valor objetivo (kg)', 75);
  await page.getByRole('button', { name: 'Crear objetivo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mi objetivo real' })).toBeVisible();
  await go(page, '/rutinas/nueva');
  await fill(page, 'Nombre de la rutina', 'Fuerza de prueba');
  await page.getByRole('button', { name: 'Ejercicio propio', exact: true }).click();
  await fill(page, 'Nombre del ejercicio', 'Sentadilla de prueba');
  await fill(page, 'Grupo muscular', 'Piernas');
  await page.getByRole('button', { name: 'Guardar rutina', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fuerza de prueba', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Comenzar entrenamiento' }).click();
  await expect(page).toHaveURL(/entrenamientos\//);
  await page.getByLabel('Realizado', { exact: true }).check();
  await fill(page, 'Carga utilizada (kg)', 20);
  await page.getByRole('button', { name: 'Guardar avance' }).click();
  await expect(page.getByRole('status')).toContainText('Avance guardado.');
  await page.reload();
  await expect(page.getByLabel('Realizado', { exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Finalizar entrenamiento' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Completado', { exact: true })).toBeVisible();
  await go(page, '/dietas/nueva');
  await fill(page, 'Nombre del plan', 'Plan de prueba');
  await fill(page, 'Meta de calorías (kcal)', 2000);
  await fill(page, 'Meta de proteínas (g)', 130);
  await fill(page, 'Meta de carbohidratos (g)', 220);
  await fill(page, 'Meta de grasas (g)', 65);
  await fill(page, 'Nombre de la comida', 'Desayuno de prueba');
  await fill(page, 'Nombre del alimento', 'Yogur ficticio');
  await fill(page, 'Cantidad consumida / planificada', 200);
  await fill(page, 'Energía (kcal)', 100);
  await fill(page, 'Proteínas (g)', 10);
  await fill(page, 'Carbohidratos (g)', 12);
  await fill(page, 'Grasas (g)', 3);
  await page.getByRole('button', { name: 'Guardar plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Plan de prueba', exact: true })).toBeVisible();
  await expect(page.getByText('200 kcal', { exact: true })).toBeVisible();
  await go(page, '/nutricion');
  await page.getByRole('button', { name: 'Registrar comida', exact: true }).click();
  await fill(page, 'Nombre de la comida', 'Mi comida registrada');
  await fill(page, 'Nombre del alimento', 'Alimento de prueba');
  await fill(page, 'Cantidad consumida / planificada', 150);
  await fill(page, 'Energía (kcal)', 200);
  await fill(page, 'Proteínas (g)', 10);
  await fill(page, 'Carbohidratos (g)', 20);
  await fill(page, 'Grasas (g)', 4);
  await page.getByRole('button', { name: 'Guardar comida', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Mi comida registrada' })).toBeVisible();
  await page.getByRole('button', { name: 'Editar Mi comida registrada', exact: true }).click();
  await fill(page, 'Cantidad consumida / planificada', 200);
  await page.getByRole('button', { name: 'Guardar comida', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.meal-entry')).toContainText('400');
  await go(page, '/asistente');
  await expect(page.getByText('DISPONIBLE', { exact: true })).toBeVisible();
  const planTools = page.locator('.ai-plan-tool');
  await planTools.nth(0).getByLabel('Preferencias opcionales').fill('Una rutina breve');
  await planTools.nth(0).getByRole('button', { name: 'Generar con IA' }).click();
  await expect(planTools.nth(0).getByText('Rutina personal por IA', { exact: true })).toBeVisible();
  await planTools.nth(1).getByLabel('Preferencias opcionales').fill('Ingredientes simples');
  await planTools.nth(1).getByRole('button', { name: 'Generar con IA' }).click();
  await expect(planTools.nth(1).getByText('Dieta personal por IA', { exact: true })).toBeVisible();
  await fill(page, 'Tu consulta', '¿Cuánto descanso entre series?');
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.locator('.ai-message.assistant')).toBeVisible();
  await go(page, '/me');
  await fill(page, 'Teléfono', '+54 11 5555 1111');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status')).toContainText('Tu perfil se actualizó');
  await page.reload();
  await expect(page.getByLabel('Teléfono', { exact: true })).toHaveValue('+54 11 5555 1111');
  await page.getByRole('button', { name: 'Eliminar cuenta', exact: true }).click();
  await fill(page, 'Contraseña actual', password);
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page).toHaveURL(/login/);
  expect(errors).toEqual([]);
});
test('catalog search, protected navigation and available AI status', async ({ page, request }) => {
  await go(page, '/dashboard');
  await expect(page).toHaveURL(/login/);
  const email = `catalog-${randomUUID()}@gym-os.test`;
  const r = await request.post('/api/v1/auth/register', {
    headers: { 'X-GymOS-Client': 'web' },
    data: { nombre: 'Catálogo', email, password },
  });
  expect(r.status()).toBe(201);
  const state = await request.storageState();
  await page.context().addCookies(state.cookies);
  await go(page, '/ejercicios');
  await fill(page, 'Buscar ejercicios', 'sentadilla');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('.exercise-card').first()).toBeVisible();
  await page
    .locator('.exercise-card')
    .first()
    .getByRole('button', { name: 'Instrucciones' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Músculo principal');
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  const aiStatus = await request.get('/api/v1/ai/status');
  expect(aiStatus.status()).toBe(200);
  expect((await aiStatus.json()).configurado).toBe(true);
  await page.goto('/admin/usuarios');
  await expect(
    page.getByRole('heading', { name: 'Esta sección necesita otro permiso' }),
  ).toBeVisible();
  expect(
    (
      await request.delete('/api/v1/me', {
        headers: { 'X-GymOS-Client': 'web' },
        data: { confirmar: true, password },
      })
    ).status(),
  ).toBe(204);
});

test('unavailable server shows a readable error and supports retry', async ({ page }) => {
  await page.route('**/api/v1/me', (route) => route.fulfill({ status: 503, body: '' }));
  await page.goto('/dashboard');
  await expect(page.getByRole('alert')).toContainText('El servidor no está disponible');
  await page.unroute('**/api/v1/me');
  await page.getByRole('button', { name: 'Reintentar conexión' }).click();
  await expect(page).toHaveURL(/login/);
});
