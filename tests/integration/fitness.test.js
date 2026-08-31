import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { DateTime } from 'luxon';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'gym_os_test';
const { sequelize } = await import('../../api/config/database.js');
const { migrate } = await import('../../api/db/migrate.js');
const { seed } = await import('../../api/db/seed.js');
const { schema } = await import('../../api/db/schema.js');
const { models } = await import('../../api/models/index.js');
const { inspectIntegrity } = await import('../../api/services/integrity.js');
const { app } = await import('../../api/app.js');
const api = '/api/v1',
  zone = 'America/Argentina/Buenos_Aires',
  pass = 'Pruebas fitness 2026!';
const date = DateTime.now().setZone(zone).toISODate();
const yesterday = DateTime.now().setZone(zone).minus({ days: 1 }).toISODate();
const nowMinus = (days) => new Date(Date.now() - days * 86400000).toISOString();
const write = (agent, method, path, data) =>
  agent[method](api + path)
    .set('X-GymOS-Client', 'web')
    .send(data);
const get = (agent, path) => agent.get(api + path);
const ok = (res, status = 200) => {
  assert.equal(res.status, status, JSON.stringify(res.body));
  return res.body;
};
let owner, other, userId, goalId, routineId, workoutId, dietId, consumedId;
const measurement = {
  peso_kg: 90,
  altura_cm: 178,
  grasa_corporal: 22,
  musculo_corporal: 40,
  nivel_actividad: 'media',
};
const exercise = {
  nombre_ejercicio: 'Sentadilla libre',
  grupo_muscular: 'Piernas',
  dia_semana: 'lunes',
  orden: 0,
  series: 3,
  repeticiones: 10,
  peso_sugerido_kg: 40,
  descanso_segundos: 90,
  observaciones: '',
};
const food = {
  nombre: 'Alimento ficticio de prueba',
  cantidad: 150,
  unidad: 'g',
  calorias: 100,
  proteinas_g: 10,
  carbohidratos_g: 20,
  grasas_g: 5,
};
const meal = {
  nombre_comida: 'Almuerzo de prueba',
  tipo_comida: 'almuerzo',
  hora: '13:00',
  alimentos: [food],
  observaciones: '',
};
const diet = {
  nombre: 'Plan de prueba',
  descripcion: '',
  calorias_objetivo: 2100,
  proteinas_objetivo_g: 140,
  carbohidratos_objetivo_g: 220,
  grasas_objetivo_g: 70,
  comidas: [meal],
};
before(async () => {
  assert.equal(sequelize.getDatabaseName(), 'gym_os_test');
  const qi = sequelize.getQueryInterface(),
    tables = await qi.showAllTables();
  for (const table of [
    'digitos_verificadores',
    ...Object.keys(schema).reverse(),
    'schema_migrations',
  ])
    if (tables.includes(table)) await qi.dropTable(table);
  await migrate();
  await seed();
  owner = request.agent(app);
  other = request.agent(app);
  userId = ok(
    await write(owner, 'post', '/auth/register', {
      nombre: 'Deportista',
      email: 'owner@fitness.test',
      password: pass,
    }),
    201,
  ).user.id;
  ok(
    await write(other, 'post', '/auth/register', {
      nombre: 'Otra persona',
      email: 'other@fitness.test',
      password: pass,
    }),
    201,
  );
});
after(async () => {
  await sequelize.close();
});

test('fitness modules implement the UML and preserve isolation and historical records', async (t) => {
  await t.test('CU011 dashboard and progress have truthful empty states', async () => {
    const progress = ok(await get(owner, '/progress'));
    assert.equal(progress.actual, null);
    assert.equal(progress.inicial, null);
    assert.deepEqual(progress.objetivos, []);
    const dashboard = ok(await get(owner, '/dashboard'));
    assert.equal(dashboard.nutricion.totales.calorias, 0);
    assert.equal(dashboard.entrenamiento_activo, null);
  });
  await t.test(
    'CU007-CU008 initial profile and updates preserve earlier measurements and validate order',
    async () => {
      assert.equal((await write(owner, 'post', '/measurements', measurement)).status, 409);
      ok(
        await write(owner, 'post', '/measurements/initial', {
          ...measurement,
          fecha_medicion: nowMinus(3),
        }),
        201,
      );
      assert.equal((await write(owner, 'post', '/measurements/initial', measurement)).status, 409);
      assert.equal(
        (await write(owner, 'post', '/measurements', { ...measurement, peso_kg: -10 })).status,
        400,
      );
      assert.equal(
        (
          await write(owner, 'post', '/measurements', {
            ...measurement,
            fecha_medicion: nowMinus(5),
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await write(owner, 'post', '/measurements', {
            ...measurement,
            fecha_medicion: nowMinus(-2),
          })
        ).status,
        400,
      );
      assert.equal(ok(await get(other, '/measurements')).total, 0);
    },
  );
  await t.test(
    'CU010 goal requires a profile, correct units and one active goal even under concurrency',
    async () => {
      const goal = {
        nombre: 'Objetivo de prueba',
        tipo: 'bajar_peso',
        valor_objetivo: 80,
        unidad: 'kg',
        fecha_inicio: yesterday,
        frecuencia_semanal: 3,
      };
      assert.equal((await write(other, 'post', '/goals', goal)).status, 409);
      assert.equal((await write(owner, 'post', '/goals', { ...goal, unidad: 'km' })).status, 400);
      const created = await Promise.all([
        write(owner, 'post', '/goals', goal),
        write(owner, 'post', '/goals', goal),
      ]);
      assert.deepEqual(created.map((r) => r.status).sort(), [201, 409]);
      goalId = created.find((r) => r.status === 201).body.id;
      assert.equal(ok(await get(owner, '/goals')).items[0].valor_inicial, 90);
    },
  );
  await t.test(
    'CU011 progress compares the goal baseline and the latest measurement without rewriting history',
    async () => {
      ok(
        await write(owner, 'post', '/measurements', {
          ...measurement,
          peso_kg: 85,
          fecha_medicion: nowMinus(1),
        }),
        201,
      );
      const progress = ok(await get(owner, '/progress'));
      assert.equal(progress.inicial.peso_kg, 90);
      assert.equal(progress.actual.peso_kg, 85);
      assert.equal(progress.diferencia_peso, -5);
      assert.equal(progress.objetivos[0].porcentaje, 50);
      assert.equal(progress.mediciones.length, 2);
    },
  );
  await t.test(
    'CU016-CU017 routines contain ordered day exercises, catalog selection and ownership',
    async () => {
      const created = ok(
        await write(owner, 'post', '/routines', {
          nombre: 'Fuerza semanal',
          objetivo_id: goalId,
          ejercicios: [exercise, { ...exercise, ejercicio_id: '0001', orden: 1 }],
        }),
        201,
      );
      routineId = created.id;
      assert.equal(created.ejercicios.length, 2);
      assert.equal(created.ejercicios[1].nombre_ejercicio, '3/4 sit-up');
      assert.equal(ok(await get(owner, '/routines')).items.length, 1);
      assert.equal((await get(other, `/routines/${routineId}`)).status, 404);
      assert.equal(
        (
          await write(other, 'post', '/routines', {
            nombre: 'Intrusa',
            objetivo_id: goalId,
            ejercicios: [exercise],
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await write(other, 'put', `/routines/${routineId}`, {
            nombre: 'Intrusa',
            ejercicios: [exercise],
          })
        ).status,
        404,
      );
    },
  );
  await t.test(
    'CU018 invalid edits do not partially replace the existing routine or child records',
    async () => {
      const previous = ok(await get(owner, `/routines/${routineId}`));
      assert.equal(
        (
          await write(owner, 'put', `/routines/${routineId}`, {
            nombre: 'Cambio inválido',
            ejercicios: [exercise, exercise],
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await write(owner, 'put', `/routines/${routineId}`, {
            nombre: 'Cambio inválido',
            ejercicios: [{ ...exercise, ejercicio_id: '999999' }],
          })
        ).status,
        404,
      );
      assert.deepEqual(ok(await get(owner, `/routines/${routineId}`)), previous);
      const valid = ok(
        await write(owner, 'put', `/routines/${routineId}`, {
          nombre: 'Fuerza actualizada',
          objetivo_id: goalId,
          ejercicios: [exercise],
        }),
      );
      assert.equal(valid.nombre, 'Fuerza actualizada');
      assert.equal(valid.ejercicios.length, 1);
    },
  );
  await t.test(
    'CU021 workout snapshots survive routine edits and only one workout can be in progress',
    async () => {
      assert.equal(
        (await write(owner, 'post', '/workouts', { rutina_id: routineId, dia_semana: 'martes' }))
          .status,
        400,
      );
      assert.equal(
        (await write(other, 'post', '/workouts', { rutina_id: routineId, dia_semana: 'lunes' }))
          .status,
        404,
      );
      const started = await Promise.all([
        write(owner, 'post', '/workouts', { rutina_id: routineId, dia_semana: 'lunes' }),
        write(owner, 'post', '/workouts', { rutina_id: routineId, dia_semana: 'lunes' }),
      ]);
      assert.deepEqual(started.map((r) => r.status).sort(), [201, 409]);
      workoutId = started.find((r) => r.status === 201).body.id;
      assert.equal(
        (await write(owner, 'delete', `/routines/${routineId}`, { confirmar: true })).status,
        409,
      );
      ok(
        await write(owner, 'put', `/routines/${routineId}`, {
          nombre: 'Fuerza modificada',
          objetivo_id: goalId,
          ejercicios: [{ ...exercise, series: 5 }],
        }),
      );
      assert.equal(ok(await get(owner, `/workouts/${workoutId}`)).ejercicios[0].series, 3);
    },
  );
  await t.test(
    'CU021 completion validates actual exercises, stores weights and does not double-count retries',
    async () => {
      const current = ok(await get(owner, `/workouts/${workoutId}`));
      const entry = current.ejercicios[0];
      const payload = {
        estado: 'completado',
        distancia_km: 2.5,
        observaciones: 'Registro de prueba',
        ejercicios: [
          { id: entry.id, series: 3, repeticiones: 10, peso_utilizado_kg: 42.5, realizado: false },
        ],
      };
      assert.equal((await write(owner, 'put', `/workouts/${workoutId}`, payload)).status, 400);
      payload.ejercicios[0].realizado = true;
      assert.equal((await write(other, 'put', `/workouts/${workoutId}`, payload)).status, 404);
      const done = ok(await write(owner, 'put', `/workouts/${workoutId}`, payload));
      assert.equal(done.estado, 'completado');
      assert.ok(done.fecha_fin);
      assert.equal(done.ejercicios[0].peso_utilizado_kg, 42.5);
      ok(await write(owner, 'put', `/workouts/${workoutId}`, payload));
      assert.equal(ok(await get(owner, '/progress')).entrenamientos_completados, 1);
      assert.equal(
        (await write(owner, 'put', `/workouts/${workoutId}`, { ...payload, estado: 'iniciado' }))
          .status,
        409,
      );
    },
  );
  await t.test(
    'CU024-CU025 diet stores meals, ingredients, times and calculated macros',
    async () => {
      const created = ok(
        await write(owner, 'post', '/diets', { ...diet, objetivo_id: goalId }),
        201,
      );
      dietId = created.id;
      assert.equal(created.comidas[0].hora, '13:00');
      assert.equal(created.comidas[0].alimentos.length, 1);
      assert.equal(created.totales.calorias, 150);
      assert.equal(created.totales.proteinas_g, 15);
      assert.equal(created.totales.carbohidratos_g, 30);
      assert.equal(ok(await get(owner, '/diets')).items.length, 1);
      assert.equal((await get(other, `/diets/${dietId}`)).status, 404);
      assert.equal(
        (await write(other, 'post', '/diets', { ...diet, objetivo_id: goalId })).status,
        404,
      );
    },
  );
  await t.test('CU027 diet edits are atomic and do not trust client-supplied totals', async () => {
    const previous = ok(await get(owner, `/diets/${dietId}`));
    assert.equal(
      (
        await write(owner, 'put', `/diets/${dietId}`, {
          ...diet,
          comidas: [{ ...meal, calorias: 999 }],
        })
      ).status,
      400,
    );
    assert.deepEqual(ok(await get(owner, `/diets/${dietId}`)), previous);
    const updated = ok(
      await write(owner, 'put', `/diets/${dietId}`, {
        ...diet,
        comidas: [{ ...meal, alimentos: [{ ...food, cantidad: 200 }] }],
      }),
    );
    assert.equal(updated.totales.calorias, 200);
    assert.equal(updated.totales.proteinas_g, 20);
  });
  await t.test(
    'CU029-CU030 consumed food is quantity-scaled and grouped by the user local calendar date',
    async () => {
      // Yesterday 23:30 AR is today 02:30 UTC; it must stay in yesterday, not leak into today.
      const time = DateTime.fromISO(yesterday + 'T23:30:00', { zone })
        .toUTC()
        .toISO();
      const created = ok(
        await write(owner, 'post', '/consumed', {
          nombre_comida: 'Cena tardía',
          tipo_comida: 'cena',
          fecha_consumo: time,
          alimentos: [food],
        }),
        201,
      );
      consumedId = created.id;
      assert.equal(created.calorias_totales, 150);
      const previous = ok(await get(owner, `/nutrition?date=${yesterday}`));
      assert.equal(previous.comidas.length, 1);
      assert.equal(previous.totales.calorias, 150);
      assert.equal(ok(await get(owner, `/nutrition?date=${date}`)).comidas.length, 0);
      assert.equal(ok(await get(other, `/nutrition?date=${yesterday}`)).comidas.length, 0);
      assert.equal((await get(other, `/nutrition?diet=${dietId}`)).status, 404);
      assert.equal(
        (await write(other, 'delete', `/consumed/${consumedId}`, { confirmar: true })).status,
        404,
      );
      const update = {
        nombre_comida: 'Cena corregida',
        tipo_comida: 'cena',
        fecha_consumo: time,
        alimentos: [{ ...food, cantidad: 200 }],
      };
      ok(await write(owner, 'put', `/consumed/${consumedId}`, update));
      assert.equal(ok(await get(owner, `/nutrition?date=${yesterday}`)).totales.calorias, 200);
      assert.equal(
        (await write(owner, 'post', '/consumed', { ...update, fecha_consumo: nowMinus(-2) }))
          .status,
        400,
      );
      assert.ok(
        await models.bitacora.count({
          where: { usuario_id: userId, accion: 'CU030_CONSULTAR_MACROS' },
        }),
      );
    },
  );
  await t.test(
    'CU012-CU013 goal completion is explicit and deletion permits a new goal without losing linked history',
    async () => {
      assert.equal(
        (await write(other, 'post', `/goals/${goalId}/complete`, { confirmar: true })).status,
        404,
      );
      const completed = ok(
        await write(owner, 'post', `/goals/${goalId}/complete`, { confirmar: true }),
      );
      assert.equal(completed.estado, 'completado');
      assert.equal(
        (await write(owner, 'post', `/goals/${goalId}/complete`, { confirmar: true })).status,
        409,
      );
      const progress = ok(await get(owner, '/progress'));
      assert.equal(progress.objetivos[0].declarado_completado, true);
      assert.equal(progress.objetivos[0].porcentaje, 50);
      const newGoal = ok(
        await write(owner, 'post', '/goals', {
          nombre: 'Constancia',
          tipo: 'aumentar_frecuencia_entrenamiento',
          valor_objetivo: 3,
          unidad: 'veces_por_semana',
          fecha_inicio: date,
        }),
        201,
      );
      assert.equal(
        ok(await get(owner, '/progress')).objetivos.find((g) => g.id === newGoal.id).valor_actual,
        1,
      );
      assert.equal(
        (await write(owner, 'delete', `/goals/${newGoal.id}`, { confirmar: false })).status,
        400,
      );
      ok(await write(owner, 'delete', `/goals/${newGoal.id}`, { confirmar: true }), 204);
      assert.equal(ok(await get(owner, '/goals')).items.length, 1);
    },
  );
  await t.test(
    'CU020-CU028 deletion preserves completed workout and independent consumed-food history',
    async () => {
      ok(await write(owner, 'delete', `/routines/${routineId}`, { confirmar: true }), 204);
      assert.equal((await get(owner, `/routines/${routineId}`)).status, 404);
      assert.equal(ok(await get(owner, `/workouts/${workoutId}`)).estado, 'completado');
      ok(await write(owner, 'delete', `/diets/${dietId}`, { confirmar: true }), 204);
      assert.equal((await get(owner, `/diets/${dietId}`)).status, 404);
      assert.equal(ok(await get(owner, `/nutrition?date=${yesterday}`)).totales.calorias, 200);
      assert.equal((await inspectIntegrity()).ok, true);
    },
  );
  await t.test(
    'CU006 deletion cascades every fitness entity and leaves no personal data',
    async () => {
      ok(await write(owner, 'delete', '/me', { confirmar: true, password: pass }), 204);
      for (const table of [
        'mediciones_fisicas',
        'objetivos',
        'rutinas',
        'entrenamientos',
        'dietas',
        'comidas_consumidas',
      ])
        assert.equal(await models[table].count({ where: { usuario_id: userId } }), 0, table);
      assert.equal((await inspectIntegrity()).ok, true);
    },
  );
});
