import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'gym_os_test';
process.env.AI_MOCK = 'false';
const { env } = await import('../../api/config/env.js');
const { sequelize } = await import('../../api/config/database.js');
const { migrate } = await import('../../api/db/migrate.js');
const { seed } = await import('../../api/db/seed.js');
const { schema } = await import('../../api/db/schema.js');
const { models } = await import('../../api/models/index.js');
const { app } = await import('../../api/app.js');

const agent = request.agent(app);
const headers = { 'X-GymOS-Client': 'web' };
const send = (method, path, data) => agent[method](`/api/v1${path}`).set(headers).send(data);
const ok = (response, status = 200) => {
  assert.equal(response.status, status, JSON.stringify(response.body));
  return response.body;
};
let routineId;
let dietId;

before(async () => {
  assert.ok(env.ai.apiKey, 'COHERE_API_KEY is required for the real end-to-end test');
  const qi = sequelize.getQueryInterface();
  const tables = await qi.showAllTables();
  for (const table of [
    'digitos_verificadores',
    ...Object.keys(schema).reverse(),
    'schema_migrations',
  ])
    if (tables.includes(table)) await qi.dropTable(table);
  await migrate();
  await seed();
  ok(
    await send('post', '/auth/register', {
      nombre: 'Cohere Real',
      email: 'cohere-real@gym-os.test',
      password: 'Cohere real 2026!',
    }),
    201,
  );
  ok(await send('patch', '/me', { consentimiento_ia: true }));
  ok(
    await send('post', '/measurements/initial', {
      peso_kg: 80,
      altura_cm: 175,
      grasa_corporal: 20,
      musculo_corporal: 42,
      nivel_actividad: 'media',
      fecha_medicion: new Date(Date.now() - 2 * 86400000).toISOString(),
    }),
    201,
  );
  ok(
    await send('post', '/goals', {
      nombre: 'Mejorar condición',
      tipo: 'mejorar_resistencia',
      valor_objetivo: 5,
      unidad: 'km',
      frecuencia_semanal: 3,
      actividad_objetivo: 'media',
      fecha_inicio: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    }),
    201,
  );
});

after(() => sequelize.close());

test('CU015, CU019, CU023, CU026 and CU031 pass end to end with real Cohere', async (t) => {
  await t.test('CU015 and CU023 generate and persist safe plans', async () => {
    const routine = ok(
      await send('post', '/ai/routines/generate', { preferencias: 'Tres días, nivel inicial' }),
      201,
    );
    routineId = routine.id;
    assert.equal(routine.tipo_generacion, 'ia');
    assert.ok(routine.ejercicios.length > 0);
    const diet = ok(
      await send('post', '/ai/diets/generate', {
        preferencias: 'Ingredientes simples, entre 2000 y 2400 kcal',
      }),
      201,
    );
    dietId = diet.id;
    assert.equal(diet.tipo_generacion, 'ia');
    assert.ok(diet.comidas.length > 0);
  });

  await t.test('CU019 and CU026 adapt the selected persisted plans', async () => {
    ok(await send('post', '/workouts', { rutina_id: routineId, dia_semana: 'lunes' }), 201);
    const routine = ok(
      await send('post', `/ai/routines/${routineId}/adapt`, {
        instrucciones: 'Reducí levemente el volumen y mantené cargas conservadoras',
      }),
    );
    assert.equal(routine.id, routineId);
    assert.ok(routine.ejercicios.length > 0);
    const diet = ok(
      await send('post', `/ai/diets/${dietId}/adapt`, {
        instrucciones: 'Mantené calorías y simplificá el desayuno',
      }),
    );
    assert.equal(diet.id, dietId);
    assert.ok(diet.comidas.length > 0);
  });

  await t.test('CU031 answers and persists a real scoped conversation', async () => {
    const conversation = ok(
      await send('post', '/ai/chat', {
        modo: 'entrenador',
        consulta: '¿Cuánto descanso entre series de fuerza?',
      }),
    );
    assert.equal(conversation.mensajes.length, 2);
    assert.ok(conversation.mensajes.at(-1).contenido.trim());
  });

  const actions = (await models.bitacora.findAll()).map((row) => row.accion);
  for (const action of [
    'CU015_GENERAR_RUTINA_IA',
    'CU019_ADAPTAR_RUTINA_IA',
    'CU023_GENERAR_DIETA_IA',
    'CU026_ADAPTAR_DIETA_IA',
    'CU031_ASISTENTE_IA',
  ])
    assert.ok(actions.includes(action), action);
});
