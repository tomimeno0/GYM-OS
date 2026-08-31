import { models } from '../models/index.js';
import { dto, owned, readFitness, writeFitness, today, requireActive } from '../lib/domain.js';
import { assert } from '../lib/errors.js';
const {
  entrenamientos: Workouts,
  entrenamiento_ejercicios: Entries,
  rutinas: Routines,
  rutina_ejercicios: Exercises,
} = models;
export async function workoutDetail(id, userId, transaction) {
  const workout = await owned(Workouts, id, userId, transaction);
  const entries = await Entries.findAll({
    where: { entrenamiento_id: id },
    order: [['orden', 'ASC']],
    transaction,
  });
  const routine = await Routines.findByPk(workout.rutina_id, {
    attributes: ['nombre'],
    transaction,
  });
  return { ...dto(workout), nombre_rutina: routine.nombre, ejercicios: dto(entries) };
}
export const getWorkout = (userId, id) =>
  readFitness(userId, (transaction) => workoutDetail(id, userId, transaction));
export const listWorkouts = (userId, { page, limit }) =>
  readFitness(userId, async (transaction) => {
    const { count, rows } = await Workouts.findAndCountAll({
      where: { usuario_id: userId },
      order: [['fecha_inicio', 'DESC']],
      offset: (page - 1) * limit,
      limit,
      transaction,
    });
    const items = [];
    for (const w of rows) items.push(await workoutDetail(w.id, userId, transaction));
    return { total: count, items };
  });
export const startWorkout = (userId, data) =>
  writeFitness(
    userId,
    'CU021_INICIAR_ENTRENAMIENTO',
    'entrenamientos',
    async (transaction, user) => {
      assert(
        !(await Workouts.findOne({
          where: { usuario_id: userId, estado: 'iniciado' },
          transaction,
        })),
        409,
        'WORKOUT_ACTIVE',
        'Ya tenés un entrenamiento en curso. Retomalo o cancelalo.',
      );
      const routine = await owned(Routines, data.rutina_id, userId, transaction);
      requireActive(routine);
      const exercises = await Exercises.findAll({
        where: { rutina_id: routine.id, dia_semana: data.dia_semana },
        order: [['orden', 'ASC']],
        transaction,
      });
      assert(exercises.length, 400, 'NO_EXERCISES', 'La rutina no tiene ejercicios para ese día.');
      const workout = await Workouts.create(
        {
          usuario_id: userId,
          rutina_id: routine.id,
          usuario_en_curso: userId,
          dia_semana: data.dia_semana,
          fecha: today(user.zona_horaria),
          fecha_inicio: new Date(),
          distancia_km: 0,
        },
        { transaction },
      );
      await Entries.bulkCreate(
        exercises.map((e) => ({
          entrenamiento_id: workout.id,
          ejercicio_id: e.ejercicio_id,
          nombre_ejercicio: e.nombre_ejercicio,
          orden: e.orden,
          series: e.series,
          repeticiones: e.repeticiones,
          peso_utilizado_kg: e.peso_sugerido_kg,
          realizado: false,
        })),
        { transaction },
      );
      return workoutDetail(workout.id, userId, transaction);
    },
  );
export const saveWorkout = (userId, id, data) =>
  writeFitness(userId, 'CU021_REGISTRAR_ENTRENAMIENTO', 'entrenamientos', async (transaction) => {
    const workout = await owned(Workouts, id, userId, transaction);
    assert(
      workout.estado === 'iniciado' || workout.estado === data.estado,
      409,
      'WORKOUT_FINISHED',
      'Un entrenamiento finalizado no puede reabrirse ni cambiar de estado.',
    );
    const entries = await Entries.findAll({ where: { entrenamiento_id: id }, transaction });
    const provided = new Set(data.ejercicios.map((e) => e.id));
    assert(
      provided.size === entries.length &&
        data.ejercicios.length === entries.length &&
        entries.every((e) => provided.has(e.id)),
      400,
      'INVALID_ENTRIES',
      'Los ejercicios no coinciden con este entrenamiento.',
    );
    for (const e of data.ejercicios)
      assert(
        !e.realizado || (e.series > 0 && e.repeticiones > 0),
        400,
        'EMPTY_EXERCISE',
        'Un ejercicio realizado necesita series y repeticiones.',
      );
    if (data.estado === 'completado')
      assert(
        data.ejercicios.every((e) => e.realizado),
        400,
        'WORKOUT_INCOMPLETE',
        'Marcá todos los ejercicios realizados o guardá el entrenamiento como incompleto.',
      );
    if (data.estado === 'incompleto')
      assert(
        data.ejercicios.some((e) => e.realizado),
        400,
        'EMPTY_WORKOUT',
        'Registrá al menos un ejercicio o cancelá el entrenamiento.',
      );
    for (const entry of data.ejercicios) {
      const { id: entryId, ...changes } = entry;
      await Entries.update(changes, { where: { id: entryId, entrenamiento_id: id }, transaction });
    }
    await workout.update(
      {
        estado: data.estado,
        observaciones: data.observaciones,
        distancia_km: data.distancia_km,
        ...(data.estado !== 'iniciado'
          ? { fecha_fin: workout.fecha_fin || new Date(), usuario_en_curso: null }
          : {}),
      },
      { transaction },
    );
    return workoutDetail(id, userId, transaction);
  });
