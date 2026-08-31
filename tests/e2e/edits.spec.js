import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const headers = { 'X-GymOS-Client': 'web' },
  password = 'Ediciones verificadas 2026!';
test('editing and confirmed deletion preserve user intent across goals, routines and diets', async ({
  page,
  request,
}) => {
  const email = `edits-${randomUUID()}@gym-os.test`;
  expect(
    (
      await request.post('/api/v1/auth/register', {
        headers,
        data: { nombre: 'Ediciones', email, password },
      })
    ).status(),
  ).toBe(201);
  const post = async (path, data) => {
    const r = await request.post('/api/v1' + path, { headers, data });
    expect(r.status()).toBe(201);
    return r.json();
  };
  await post('/measurements/initial', { peso_kg: 80, altura_cm: 175, nivel_actividad: 'media' });
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());
  await post('/goals', {
    nombre: 'Objetivo editable',
    tipo: 'bajar_peso',
    valor_objetivo: 75,
    unidad: 'kg',
    fecha_inicio: today,
  });
  const routine = await post('/routines', {
    nombre: 'Rutina original',
    ejercicios: [
      {
        nombre_ejercicio: 'Sentadilla original',
        dia_semana: 'lunes',
        orden: 0,
        series: 3,
        repeticiones: 10,
      },
    ],
  });
  const diet = await post('/diets', {
    nombre: 'Plan original',
    calorias_objetivo: 2000,
    proteinas_objetivo_g: 100,
    carbohidratos_objetivo_g: 250,
    grasas_objetivo_g: 70,
    comidas: [
      {
        nombre_comida: 'Comida original',
        tipo_comida: 'desayuno',
        hora: '08:00',
        alimentos: [
          {
            nombre: 'Alimento ficticio',
            cantidad: 100,
            unidad: 'g',
            calorias: 100,
            proteinas_g: 10,
            carbohidratos_g: 10,
            grasas_g: 5,
          },
        ],
      },
    ],
  });
  await page.context().addCookies((await request.storageState()).cookies);
  await page.goto(`/rutinas/${routine.id}/editar`);
  await page.getByLabel('Nombre de la rutina', { exact: true }).fill('Rutina modificada');
  await page.getByRole('button', { name: 'Elegir del catálogo' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Agregar', exact: true })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Guardar rutina', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Rutina modificada', exact: true })).toBeVisible();
  await expect(page.locator('.exercise-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Volver', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Rutina modificada', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page).toHaveURL(/\/rutinas$/);
  await expect(page.getByRole('heading', { name: 'Tu próxima rutina empieza acá' })).toBeVisible();
  await page.goto(`/dietas/${diet.id}/editar`);
  await page.getByLabel('Nombre del plan', { exact: true }).fill('Plan modificado');
  await page.getByLabel('Cantidad consumida / planificada', { exact: true }).fill('250');
  await page.getByRole('button', { name: 'Guardar plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Plan modificado', exact: true })).toBeVisible();
  await expect(page.getByText('250 kcal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page).toHaveURL(/\/dietas$/);
  await page.goto('/progreso');
  await page.getByRole('button', { name: 'Registrar medidas' }).click();
  await page.getByLabel('Peso (kg)', { exact: true }).fill('78');
  await page.getByRole('button', { name: 'Guardar medición' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: '78', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '80', exact: true })).toBeVisible();
  await page.goto('/objetivos');
  await page.getByRole('button', { name: 'Marcar como cumplido' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('COMPLETADO', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿Qué te gustaría lograr?' })).toBeVisible();
  expect(
    (await request.delete('/api/v1/me', { headers, data: { confirmar: true, password } })).status(),
  ).toBe(204);
});
