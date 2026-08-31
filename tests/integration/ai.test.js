import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'gym_os_test';
process.env.AI_MOCK = 'true';
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
let goalId, routineId, dietId;

before(async () => {
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
      nombre: 'Persona IA',
      email: 'ia@gym.test',
      password: 'Pruebas con IA 2026!',
    }),
    201,
  );
});

after(() => sequelize.close());

test('CU015, CU019, CU023, CU026 and CU031 execute end to end', async (t) => {
  await t.test('generation is blocked until the physical context exists', async () => {
    assert.equal((await send('post', '/ai/routines/generate', { preferencias: '' })).status, 409);
    ok(
      await send('post', '/measurements/initial', {
        peso_kg: 82,
        altura_cm: 176,
        grasa_corporal: 20,
        musculo_corporal: 42,
        nivel_actividad: 'media',
        fecha_medicion: new Date(Date.now() - 2 * 86400000).toISOString(),
      }),
      201,
    );
    const date = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    goalId = ok(
      await send('post', '/goals', {
        nombre: 'Mejorar condición',
        tipo: 'mejorar_resistencia',
        valor_objetivo: 5,
        unidad: 'km',
        frecuencia_semanal: 3,
        actividad_objetivo: 'media',
        fecha_inicio: date,
      }),
      201,
    ).id;
  });

  await t.test('CU015 and CU023 persist valid IA plans linked to the active goal', async () => {
    const routine = ok(
      await send('post', '/ai/routines/generate', { preferencias: 'Tres días por semana' }),
      201,
    );
    routineId = routine.id;
    assert.equal(routine.tipo_generacion, 'ia');
    assert.equal(routine.objetivo_id, goalId);
    assert.equal(routine.ejercicios.length, 1);
    const diet = ok(
      await send('post', '/ai/diets/generate', { preferencias: 'Ingredientes simples' }),
      201,
    );
    dietId = diet.id;
    assert.equal(diet.tipo_generacion, 'ia');
    assert.equal(diet.objetivo_id, goalId);
    assert.equal(diet.comidas.length, 1);
  });

  await t.test('CU019 requires history and then atomically replaces the routine', async () => {
    assert.equal(
      (await send('post', `/ai/routines/${routineId}/adapt`, { instrucciones: 'Más suave' }))
        .status,
      409,
    );
    ok(await send('post', '/workouts', { rutina_id: routineId, dia_semana: 'lunes' }), 201);
    const adapted = ok(
      await send('post', `/ai/routines/${routineId}/adapt`, {
        instrucciones: 'Reducí el volumen',
      }),
    );
    assert.equal(adapted.id, routineId);
    assert.equal(adapted.nombre, 'Rutina adaptada por IA');
    assert.equal(adapted.ejercicios.length, 1);
  });

  await t.test('CU026 adapts the selected diet and preserves its identity', async () => {
    const adapted = ok(
      await send('post', `/ai/diets/${dietId}/adapt`, {
        instrucciones: 'Usá un desayuno más liviano',
      }),
    );
    assert.equal(adapted.id, dietId);
    assert.equal(adapted.nombre, 'Dieta adaptada por IA');
    assert.equal(adapted.tipo_generacion, 'ia');
  });

  await t.test('CU031 stores scoped conversations and rejects unrelated requests', async () => {
    const chat = ok(
      await send('post', '/ai/chat', {
        modo: 'entrenador',
        consulta: '¿Cómo organizo el descanso entre series?',
      }),
    );
    assert.equal(chat.mensajes.length, 2);
    const continued = ok(
      await send('post', '/ai/chat', {
        conversacion_id: chat.id,
        modo: 'entrenador',
        consulta: '¿Y entre ejercicios?',
      }),
    );
    assert.equal(continued.mensajes.length, 4);
    assert.equal(
      (
        await send('post', '/ai/chat', {
          modo: 'entrenador',
          consulta: '¿Qué criptomoneda compro?',
        })
      ).status,
      400,
    );
    assert.equal(await models.conversaciones.count(), 1);
    assert.equal(await models.mensajes.count(), 4);
  });

  await t.test('all five IA use cases are auditable', async () => {
    const actions = (await models.bitacora.findAll()).map((row) => row.accion);
    for (const action of [
      'CU015_GENERAR_RUTINA_IA',
      'CU019_ADAPTAR_RUTINA_IA',
      'CU023_GENERAR_DIETA_IA',
      'CU026_ADAPTAR_DIETA_IA',
      'CU031_ASISTENTE_IA',
    ])
      assert(actions.includes(action), action);
  });
});
