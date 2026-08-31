import { pathToFileURL } from 'node:url';
import { DateTime } from 'luxon';
import { models } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { seed } from './seed.js';
import { addMeasurement, createGoal } from '../services/fitness.js';
import { saveRoutine } from '../services/routines.js';
import { saveDiet, saveConsumed } from '../services/nutrition.js';
import { startWorkout, saveWorkout } from '../services/workouts.js';

export async function seedFitnessDemo(email = 'cliente@gym-os.demo') {
  if (!['cliente@gym-os.demo', 'visual-qa@gym-os.test'].includes(email))
    throw new Error('Solo cuentas ficticias de demostración.');
  await seed({ demo: true });
  const user = await models.usuarios.findOne({ where: { email } });
  if (!user) throw new Error('La cuenta de demostración no existe.');
  if (await models.mediciones_fisicas.count({ where: { usuario_id: user.id } })) return;
  const start = DateTime.now().setZone(user.zona_horaria).minus({ days: 28 });
  const measurement = {
    peso_kg: 82,
    altura_cm: 178,
    nivel_actividad: 'media',
    grasa_corporal: 23,
    musculo_corporal: 40,
  };
  await addMeasurement(user.id, { ...measurement, fecha_medicion: start.toISO() }, true);
  const goal = await createGoal(user.id, {
    nombre: 'Volver a mi mejor ritmo',
    descripcion: 'Un objetivo ficticio para explorar cómo funciona el seguimiento.',
    tipo: 'bajar_peso',
    valor_objetivo: 78,
    unidad: 'kg',
    frecuencia_semanal: 3,
    actividad_objetivo: 'media',
    fecha_inicio: start.toISODate(),
    fecha_fin_estimada: start.plus({ days: 90 }).toISODate(),
  });
  for (const [days, weight] of [
    [7, 81.6],
    [14, 81.2],
    [21, 80.7],
    [27, 80.4],
  ])
    await addMeasurement(
      user.id,
      { ...measurement, peso_kg: weight, fecha_medicion: start.plus({ days }).toISO() },
      false,
    );
  const base = {
    grupo_muscular: 'General',
    series: 3,
    repeticiones: 12,
    peso_sugerido_kg: 0,
    descanso_segundos: 90,
    observaciones: 'Demostración. Ajustar con un profesional.',
  };
  const routine = await saveRoutine(user.id, {
    nombre: 'Fuerza · Full body',
    descripcion: 'Tres días para construir constancia. Datos de demostración.',
    objetivo_id: goal.id,
    ejercicios: ['lunes', 'miercoles', 'viernes'].flatMap((day) =>
      ['Sentadilla con peso corporal', 'Flexiones adaptadas', 'Remo con mancuerna'].map(
        (name, i) => ({ ...base, nombre_ejercicio: name, dia_semana: day, orden: i }),
      ),
    ),
  });
  await saveRoutine(user.id, {
    nombre: 'Movilidad & recuperación',
    descripcion: 'Una pausa activa para acompañar la semana.',
    ejercicios: [
      { ...base, nombre_ejercicio: 'Movilidad de hombros', dia_semana: 'martes', orden: 0 },
      { ...base, nombre_ejercicio: 'Movilidad de cadera', dia_semana: 'martes', orden: 1 },
    ],
  });
  const foods = [
    {
      nombre: 'Yogur natural (ejemplo)',
      cantidad: 200,
      unidad: 'g',
      calorias: 60,
      proteinas_g: 5,
      carbohidratos_g: 6,
      grasas_g: 2,
      fuente: 'Datos ficticios de demostración',
    },
    {
      nombre: 'Avena (ejemplo)',
      cantidad: 60,
      unidad: 'g',
      calorias: 370,
      proteinas_g: 13,
      carbohidratos_g: 60,
      grasas_g: 7,
      fuente: 'Datos ficticios de demostración',
    },
  ];
  await saveDiet(user.id, {
    nombre: 'Mi organización semanal',
    descripcion:
      'Plan ficticio para probar la aplicación. No constituye una recomendación nutricional.',
    objetivo_id: goal.id,
    calorias_objetivo: 2200,
    proteinas_objetivo_g: 140,
    carbohidratos_objetivo_g: 250,
    grasas_objetivo_g: 70,
    comidas: [
      {
        nombre_comida: 'Desayuno con tiempo',
        tipo_comida: 'desayuno',
        hora: '08:30',
        alimentos: foods,
        observaciones: 'Ejemplo de registro, sin recomendación dietética.',
      },
    ],
  });
  await saveConsumed(user.id, {
    nombre_comida: 'Desayuno de hoy · ejemplo',
    tipo_comida: 'desayuno',
    fecha_consumo: new Date().toISOString(),
    alimentos: foods,
  });
  const workout = await startWorkout(user.id, { rutina_id: routine.id, dia_semana: 'lunes' });
  await saveWorkout(user.id, workout.id, {
    estado: 'completado',
    observaciones: 'Sesión ficticia para explorar el historial.',
    distancia_km: 0,
    ejercicios: workout.ejercicios.map((e) => ({
      id: e.id,
      series: 3,
      repeticiones: 12,
      peso_utilizado_kg: 0,
      realizado: true,
      observaciones: '',
    })),
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await seedFitnessDemo(
      process.argv.includes('--visual') ? 'visual-qa@gym-os.test' : 'cliente@gym-os.demo',
    );
    console.log('Demostración lista, sin modificar cuentas con registros previos.');
  } finally {
    await sequelize.close();
  }
}
