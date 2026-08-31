import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMacros } from '../../api/services/nutrition.js';
import { goalPercentage } from '../../api/services/fitness.js';
import { dayRange } from '../../api/lib/domain.js';
import { exercises, searchExercises, getExercise, provenance } from '../../api/services/catalog.js';
import { normalizeFood, searchFoods } from '../../api/services/foods.js';

test('macros use per-100 values for grams/ml and per-portion values for portions', () => {
  const foods = [
    { cantidad: 150, unidad: 'g', calorias: 100, proteinas_g: 10, carbohidratos_g: 5, grasas_g: 2 },
    { cantidad: 250, unidad: 'ml', calorias: 20, proteinas_g: 2, carbohidratos_g: 1, grasas_g: 0 },
    {
      cantidad: 2,
      unidad: 'porcion',
      calorias: 80,
      proteinas_g: 3,
      carbohidratos_g: 4,
      grasas_g: 5,
    },
  ];
  assert.deepEqual(calculateMacros(foods), {
    calorias: 360,
    proteinas_g: 26,
    carbohidratos_g: 18,
    grasas_g: 13,
  });
  assert.throws(
    () =>
      calculateMacros([
        {
          cantidad: 10000,
          unidad: 'porcion',
          calorias: 10000,
          proteinas_g: 1000,
          carbohidratos_g: 1000,
          grasas_g: 1000,
        },
      ]),
    /rango/,
  );
});
test('progress respects both goal directions, clamps to bounds and handles no change or no data', () => {
  assert.equal(goalPercentage(90, 80, 85), 50);
  assert.equal(goalPercentage(70, 80, 75), 50);
  assert.equal(goalPercentage(90, 80, 95), 0);
  assert.equal(goalPercentage(90, 80, 75), 100);
  assert.equal(goalPercentage(80, 80, 80), 100);
  assert.equal(goalPercentage(80, 80, 81), 0);
  assert.equal(goalPercentage(null, 80, 75), null);
});
test('daily windows honor user timezone and daylight-saving 23-hour days', () => {
  const ar = dayRange('2026-08-30', 'America/Argentina/Buenos_Aires');
  assert.equal(ar.start.toISOString(), '2026-08-30T03:00:00.000Z');
  assert.equal(ar.end.toISOString(), '2026-08-31T03:00:00.000Z');
  const ny = dayRange('2026-03-08', 'America/New_York');
  assert.equal(ny.end - ny.start, 23 * 3600000);
});
test('the complete licensed exercise catalog is searchable and excludes third-party media', () => {
  assert.equal(exercises.length, 1324);
  assert.equal(provenance.count, 1324);
  assert.ok(
    exercises.every(
      (e) =>
        e.id && e.name && typeof e.instructions.es === 'string' && e.instructions.es.length > 10,
    ),
  );
  assert.ok(exercises.every((e) => !('image' in e) && !('gif_url' in e)));
  const query = searchExercises({ category: 'chest', equipment: 'barbell', page: 1, limit: 10 });
  assert.equal(query.items.length, 10);
  assert.ok(query.items.every((e) => e.category === 'chest' && e.equipment === 'barbell'));
  assert.ok(searchExercises({ q: 'mancuernas', page: 1, limit: 10 }).total > 0);
  assert.equal(getExercise('0001').id, '0001');
  assert.throws(() => getExercise('missing'));
});
test('food provider normalization distinguishes unavailable nutrition from zero values', () => {
  assert.equal(normalizeFood({ code: '123', nutriments: {} }).disponible, false);
  const food = normalizeFood({
    code: '123',
    product_name: 'Water',
    nutriments: { 'energy-kcal_100g': 0, proteins_100g: 0, carbohydrates_100g: 0, fat_100g: 0 },
  });
  assert.equal(food.disponible, true);
  assert.equal(food.calorias, 0);
  assert.match(food.fuente, /Open Food Facts/);
});

test('food search validates, normalizes and caches provider results', async (t) => {
  const originalFetch = global.fetch;
  const originalBase = process.env.FOOD_API_BASE;
  t.after(() => {
    global.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.FOOD_API_BASE;
    else process.env.FOOD_API_BASE = originalBase;
  });
  process.env.FOOD_API_BASE = 'https://world.openfoodfacts.org';
  let calls = 0;
  let requestedUrl;
  global.fetch = async (url) => {
    calls += 1;
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({
        products: [
          {
            code: 'qa-1',
            product_name_es: 'Avena de prueba',
            nutriments: {
              energy_100g: 418.4,
              proteins_100g: 10,
              carbohydrates_100g: 20,
              fat_100g: 5,
            },
          },
        ],
      }),
    };
  };
  const first = await searchFoods('avena-qa-unica');
  const cached = await searchFoods('avena-qa-unica');
  assert.equal(calls, 1);
  assert.deepEqual(cached, first);
  assert.equal(first.items[0].nombre, 'Avena de prueba');
  assert.equal(first.items[0].calorias, 100);
  assert.equal(requestedUrl.searchParams.get('search_terms'), 'avena-qa-unica');
});

test('food barcode and provider failures return domain-safe errors', async (t) => {
  const originalFetch = global.fetch;
  const originalBase = process.env.FOOD_API_BASE;
  t.after(() => {
    global.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.FOOD_API_BASE;
    else process.env.FOOD_API_BASE = originalBase;
  });
  process.env.FOOD_API_BASE = 'https://world.openfoodfacts.org';
  global.fetch = async () => ({ ok: true, json: async () => ({ status: 0 }) });
  await assert.rejects(
    () => searchFoods(undefined, '9999999999999'),
    (error) => error.code === 'FOOD_NOT_FOUND',
  );
  global.fetch = async () => {
    throw new Error('network');
  };
  await assert.rejects(
    () => searchFoods('proveedor-caido-qa'),
    (error) => error.code === 'FOOD_PROVIDER_UNAVAILABLE',
  );
  process.env.FOOD_API_BASE = 'https://invalid.example';
  await assert.rejects(
    () => searchFoods('config-invalida-qa'),
    (error) => error.code === 'FOOD_CONFIG',
  );
});
