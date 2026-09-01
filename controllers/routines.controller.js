import { Op } from 'sequelize';
import { models } from '../models/index.js';
import {
  dto,
  owned,
  readFitness,
  writeFitness,
  requireActive,
} from '../controllers/domain.controller.js';
import { assert } from './errors.controller.js';
import { validateGoalLink } from './fitness.controller.js';
import { getExercise } from './catalog.controller.js';
import { Rutina, RutinaEjercicio } from '../models/uml.model.js';

const { rutinas: Routines, rutina_ejercicios: Exercises, entrenamientos: Workouts } = models;
export async function routineDetail(id, userId, transaction) {
  const routine = await owned(Routines, id, userId, transaction, {
    where: { estado: { [Op.ne]: 'eliminada' } },
  });
  const exercises = await Exercises.findAll({
    where: { rutina_id: routine.id },
    order: [
      ['orden', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });
  return { ...dto(routine), ejercicios: dto(exercises) };
}
export const listRoutines = (userId) =>
  readFitness(userId, async (transaction) => {
    const rows = await Routines.findAll({
      where: { usuario_id: userId, estado: { [Op.ne]: 'eliminada' } },
      order: [['fecha_creacion', 'DESC']],
      transaction,
    });
    const items = [];
    for (const r of rows) items.push(await routineDetail(r.id, userId, transaction));
    return { items };
  });
export const getRoutine = (userId, id) =>
  readFitness(userId, (transaction) => routineDetail(id, userId, transaction));
export function normalizeExercises(exercises) {
  const positions = new Set();
  return exercises.map((item) => {
    const key = `${item.dia_semana}:${item.orden}`;
    assert(
      !positions.has(key),
      400,
      'DUPLICATE_ORDER',
      'Cada ejercicio debe tener un orden distinto dentro de su día.',
    );
    positions.add(key);
    if (!item.ejercicio_id) return item;
    const catalog = getExercise(item.ejercicio_id);
    return { ...item, nombre_ejercicio: catalog.name, grupo_muscular: catalog.category };
  });
}
export async function persistRoutine(userId, data, id, transaction, generation = 'manual') {
  await validateGoalLink(data.objetivo_id, userId, transaction);
  const ejercicios = normalizeExercises(data.ejercicios);
  const { ejercicios: ignored, ...fields } = data;
  let routine;
  if (id) {
    routine = await owned(Routines, id, userId, transaction);
    requireActive(routine);
    await routine.update(
      {
        ...fields,
        tipo_generacion: generation,
        fecha_actualizacion: new Date(),
      },
      { transaction },
    );
    await new Rutina(
      {},
      { eliminarEjercicio: () => Exercises.destroy({ where: { rutina_id: id }, transaction }) },
    ).eliminarEjercicio();
  } else
    routine = await Routines.create(
      {
        ...fields,
        usuario_id: userId,
        tipo_generacion: generation,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
      },
      { transaction },
    );
  const umlExercises = ejercicios.map((exercise) =>
    new Rutina(
      {},
      { agregarEjercicio: () => ({ ...exercise, rutina_id: routine.id }) },
    ).agregarEjercicio(),
  );
  await Exercises.bulkCreate(
    umlExercises.map((exercise) =>
      new RutinaEjercicio(
        {},
        { actualizarRutinaEjercicio: () => exercise },
      ).actualizarRutinaEjercicio(),
    ),
    { transaction },
  );
  return routineDetail(routine.id, userId, transaction);
}
const saveRoutineImpl = (userId, data, id) =>
  writeFitness(
    userId,
    id ? 'CU018_MODIFICAR_RUTINA' : 'CU016_CREAR_RUTINA',
    'rutinas',
    (transaction) => persistRoutine(userId, data, id, transaction),
  );
export const saveRoutine = (...args) =>
  new Rutina({}, { actualizarRutina: () => saveRoutineImpl(...args) }).actualizarRutina();
export const saveAiRoutine = (userId, data, id, action) =>
  writeFitness(userId, action, 'ia', (transaction) =>
    persistRoutine(userId, data, id, transaction, 'ia'),
  );
const removeRoutineImpl = (userId, id) =>
  writeFitness(userId, 'CU020_ELIMINAR_RUTINA', 'rutinas', async (transaction) => {
    const routine = await owned(Routines, id, userId, transaction);
    requireActive(routine);
    assert(
      !(await Workouts.count({ where: { rutina_id: id, estado: 'iniciado' }, transaction })),
      409,
      'WORKOUT_ACTIVE',
      'Finalizá o cancelá el entrenamiento en curso antes de eliminar la rutina.',
    );
    return routine.update(
      { estado: 'eliminada', fecha_actualizacion: new Date() },
      { transaction },
    );
  });
export const removeRoutine = (...args) =>
  new Rutina({}, { eliminarRutina: () => removeRoutineImpl(...args) }).eliminarRutina();
