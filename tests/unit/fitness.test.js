import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMacros } from '../../api/services/nutrition.js';
import { goalPercentage } from '../../api/services/fitness.js';
import { dayRange } from '../../api/lib/domain.js';
import { exercises, searchExercises, getExercise, provenance } from '../../api/services/catalog.js';
import { normalizeFood } from '../../api/services/foods.js';

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
