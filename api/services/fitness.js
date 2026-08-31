import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import { models } from '../models/index.js';
import {
  dto,
  owned,
  readFitness,
  writeFitness,
  today,
  notFuture,
  requireActive,
  round,
} from '../lib/domain.js';
import { assert } from '../lib/errors.js';
import { Cliente, MedicionCorporal, Objetivo, PerfilFisico, Progreso } from '../domain/uml.js';

const { mediciones_fisicas: Measurements, objetivos: Goals, entrenamientos: Workouts } = models;
export async function latestMeasurement(userId, transaction, before) {
  return Measurements.findOne({
    where: { usuario_id: userId, ...(before ? { fecha_medicion: { [Op.lte]: before } } : {}) },
    order: [
      ['fecha_medicion', 'DESC'],
      ['id', 'DESC'],
    ],
    transaction,
  });
}
export async function activeGoal(userId, transaction) {
  return Goals.findOne({ where: { usuario_id: userId, estado: 'activo' }, transaction });
}
export async function validateGoalLink(id, userId, transaction) {
  if (!id) return null;
  const goal = await owned(Goals, id, userId, transaction);
  requireActive(goal);
  return goal;
}
export const listMeasurements = (userId, { page = 1, limit = 25 } = {}) =>
  readFitness(userId, async (transaction) => {
    const { count, rows } = await Measurements.findAndCountAll({
      where: { usuario_id: userId },
      order: [
        ['fecha_medicion', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset: (page - 1) * limit,
      transaction,
    });
    return { total: count, items: dto(rows) };
  });
const updatePhysicalFields = (data) => {
  const operations = {
    cambiarPeso: () => data.peso_kg,
    cambiarAltura: () => data.altura_cm,
    cambiarPorcMusculo: () => data.musculo_corporal,
    cambiarPorcGraso: () => data.grasa_corporal,
    cambiarNivelActividad: () => data.nivel_actividad,
  };
  const profile = new PerfilFisico({}, operations);
  return {
    ...data,
    peso_kg: profile.cambiarPeso(),
    altura_cm: profile.cambiarAltura(),
    musculo_corporal: profile.cambiarPorcMusculo(),
    grasa_corporal: profile.cambiarPorcGraso(),
    nivel_actividad: profile.cambiarNivelActividad(),
  };
};
const addMeasurementImpl = (userId, data, initial) =>
  writeFitness(
    userId,
    initial ? 'CU007_DATOS_FISICOS' : 'CU008_DATOS_FISICOS',
    'perfil_fisico',
    async (transaction) => {
      const current = await latestMeasurement(userId, transaction);
      assert(
        initial ? !current : current,
        409,
        initial ? 'PROFILE_EXISTS' : 'PROFILE_REQUIRED',
        initial
          ? 'Ya tenés un perfil físico. Registrá una actualización.'
          : 'Primero cargá tus datos físicos iniciales.',
      );
      const fecha_medicion = data.fecha_medicion ? new Date(data.fecha_medicion) : new Date();
      notFuture(fecha_medicion);
      assert(
        !current || fecha_medicion > current.fecha_medicion,
        400,
        'MEASUREMENT_ORDER',
        'La actualización debe ser posterior a la última medición.',
      );
      return Measurements.create(
        { ...updatePhysicalFields(data), fecha_medicion, usuario_id: userId },
        { transaction },
      );
    },
  );
export const addMeasurement = (...args) =>
  new MedicionCorporal(
    {},
    { actualizarMedicion: () => addMeasurementImpl(...args) },
  ).actualizarMedicion();
const listGoalsImpl = (userId) =>
  readFitness(userId, async (transaction) => ({
    items: dto(
      await Goals.findAll({
        where: { usuario_id: userId, estado: { [Op.ne]: 'eliminado' } },
        order: [['fecha_inicio', 'DESC']],
        transaction,
      }),
    ),
  }));
export const listGoals = (...args) =>
  new Objetivo({}, { visuaizarObjetivo: () => listGoalsImpl(...args) }).visuaizarObjetivo();
function validateGoalValues(data, measurement) {
  const expected = {
    bajar_peso: 'kg',
    ganar_masa_muscular: 'kg',
    mantener_peso: 'kg',
    definir: 'porcentaje',
    mejorar_resistencia: 'km',
    aumentar_frecuencia_entrenamiento: 'veces_por_semana',
  };
  assert(
    data.unidad === expected[data.tipo],
    400,
    'GOAL_UNIT',
    `La unidad para este objetivo debe ser ${expected[data.tipo]}.`,
  );
  if (data.unidad === 'kg')
    assert(
      data.valor_objetivo >= 20 && data.valor_objetivo <= 400,
      400,
      'GOAL_RANGE',
      'El peso objetivo debe estar entre 20 y 400 kg.',
    );
  if (data.unidad === 'porcentaje')
    assert(
      data.valor_objetivo <= 75 && measurement.grasa_corporal != null,
      400,
      'BODY_FAT_REQUIRED',
      'Registrá tu porcentaje de grasa y un objetivo válido.',
    );
  if (data.unidad === 'veces_por_semana')
    assert(
      Number.isInteger(data.valor_objetivo) && data.valor_objetivo <= 7,
      400,
      'GOAL_RANGE',
      'La frecuencia debe ser de 1 a 7 días por semana.',
    );
  if (data.unidad === 'km')
    assert(
      data.valor_objetivo <= 500,
      400,
      'GOAL_RANGE',
      'La distancia objetivo supera el rango admitido.',
    );
  if (data.tipo === 'bajar_peso')
    assert(
      data.valor_objetivo < measurement.peso_kg,
      400,
      'GOAL_DIRECTION',
      'El objetivo debe ser menor que tu peso inicial.',
    );
  if (data.tipo === 'ganar_masa_muscular')
    assert(
      data.valor_objetivo > measurement.peso_kg,
      400,
      'GOAL_DIRECTION',
      'El objetivo debe ser mayor que tu peso inicial.',
    );
  if (data.tipo === 'definir')
    assert(
      data.valor_objetivo < measurement.grasa_corporal,
      400,
      'GOAL_DIRECTION',
      'El objetivo debe ser menor que tu porcentaje inicial.',
    );
}
const createGoalImpl = (userId, data) =>
  writeFitness(userId, 'CU010_DEFINIR_OBJETIVO', 'objetivos', async (transaction, user) => {
    assert(
      !(await activeGoal(userId, transaction)),
      409,
      'ACTIVE_GOAL_EXISTS',
      'Completá o eliminá tu objetivo actual antes de crear otro.',
    );
    const endOfStart = DateTime.fromISO(data.fecha_inicio, { zone: user.zona_horaria })
      .endOf('day')
      .toJSDate();
    const measurement = await latestMeasurement(userId, transaction, endOfStart);
    assert(measurement, 409, 'PROFILE_REQUIRED', 'Primero registrá tu perfil físico.');
    assert(
      data.fecha_inicio <= today(user.zona_horaria),
      400,
      'FUTURE_DATE',
      'La fecha de inicio no puede ser futura.',
    );
    validateGoalValues(data, measurement);
    const start = DateTime.fromISO(data.fecha_inicio, { zone: user.zona_horaria });
    const baselineWorkouts = await Workouts.findAll({
      where: {
        usuario_id: userId,
        estado: 'completado',
        fecha: { [Op.gte]: start.minus({ days: 7 }).toISODate(), [Op.lt]: data.fecha_inicio },
      },
      transaction,
    });
    const valor_inicial =
      data.unidad === 'kg'
        ? measurement.peso_kg
        : data.unidad === 'porcentaje'
          ? measurement.grasa_corporal
          : data.unidad === 'km'
            ? Math.max(0, ...baselineWorkouts.map((w) => Number(w.distancia_km || 0)))
            : new Set(baselineWorkouts.map((w) => w.fecha)).size;
    if (data.unidad === 'km' || data.unidad === 'veces_por_semana')
      assert(
        data.valor_objetivo > valor_inicial,
        400,
        'GOAL_DIRECTION',
        'El objetivo debe superar tu registro inicial de la semana anterior.',
      );
    return Goals.create(
      {
        ...data,
        usuario_id: userId,
        usuario_activo: userId,
        medicion_inicio_id: measurement.id,
        peso_inicial: measurement.peso_kg,
        valor_inicial,
      },
      { transaction },
    );
  });
export const createGoal = (...args) =>
  new Objetivo({}, { definirObjeto: () => createGoalImpl(...args) }).definirObjeto();
const completeGoalImpl = (userId, id) =>
  writeFitness(userId, 'CU012_COMPLETAR_OBJETIVO', 'objetivos', async (transaction, user) => {
    const goal = await owned(Goals, id, userId, transaction);
    requireActive(goal);
    return goal.update(
      { estado: 'completado', usuario_activo: null, fecha_completado: today(user.zona_horaria) },
      { transaction },
    );
  });
export const completeGoal = (...args) =>
  new Objetivo({}, { marcarCompletado: () => completeGoalImpl(...args) }).marcarCompletado();
const removeGoalImpl = (userId, id) =>
  writeFitness(userId, 'CU013_ELIMINAR_OBJETIVO', 'objetivos', async (transaction) => {
    const goal = await owned(Goals, id, userId, transaction);
    assert(goal.estado !== 'eliminado', 404, 'NOT_FOUND', 'No se encontró el objetivo.');
    return goal.update({ estado: 'eliminado', usuario_activo: null }, { transaction });
  });
export const removeGoal = (...args) =>
  new Objetivo({}, { eliminarObjetivo: () => removeGoalImpl(...args) }).eliminarObjetivo();
function goalPercentageImpl(initial, target, current) {
  if (current == null || initial == null) return null;
  if (target === initial) return current === target ? 100 : 0;
  return round(Math.max(0, Math.min(100, ((current - initial) / (target - initial)) * 100)));
}
export const goalPercentage = (...args) =>
  new Progreso({}, { calcularPorcentaje: () => goalPercentageImpl(...args) }).calcularPorcentaje();
export async function progressData(userId, user, transaction, days = 90) {
  const measurements = await Measurements.findAll({
    where: { usuario_id: userId },
    order: [
      ['fecha_medicion', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });
  const goals = await Goals.findAll({
    where: { usuario_id: userId, estado: { [Op.ne]: 'eliminado' } },
    order: [['fecha_inicio', 'DESC']],
    transaction,
  });
  const currentDay = today(user.zona_horaria),
    weekStart = DateTime.fromISO(currentDay).startOf('week').toISODate();
  const workouts = await Workouts.findAll({
    where: { usuario_id: userId },
    order: [['fecha_inicio', 'DESC']],
    transaction,
  });
  const completed = workouts.filter((w) => w.estado === 'completado');
  const weekly = completed.filter((w) => w.fecha >= weekStart && w.fecha <= currentDay);
  const initial = measurements[0] || null,
    current = measurements.at(-1) || null;
  const goalProgress = goals.map((goal) => {
    const base = goal.valor_inicial ?? (goal.unidad === 'kg' ? goal.peso_inicial : null);
    const cutoff = goal.fecha_completado
      ? DateTime.fromISO(goal.fecha_completado, { zone: user.zona_horaria }).endOf('day').toMillis()
      : Infinity;
    const relevantMeasurement = measurements
      .filter((m) => m.fecha_medicion.getTime() <= cutoff)
      .at(-1);
    const endDay = goal.fecha_completado || currentDay;
    const goalWeekStart = DateTime.fromISO(endDay).startOf('week').toISODate();
    const relevantWorkouts = completed.filter(
      (w) => w.fecha >= goal.fecha_inicio && w.fecha <= endDay,
    );
    const value =
      goal.unidad === 'kg'
        ? relevantMeasurement?.peso_kg
        : goal.unidad === 'porcentaje'
          ? relevantMeasurement?.grasa_corporal
          : goal.unidad === 'km'
            ? Math.max(0, ...relevantWorkouts.map((w) => Number(w.distancia_km || 0)))
            : new Set(relevantWorkouts.filter((w) => w.fecha >= goalWeekStart).map((w) => w.fecha))
                .size;
    return {
      ...dto(goal),
      valor_actual: value ?? null,
      porcentaje: goalPercentage(
        base == null ? null : Number(base),
        Number(goal.valor_objetivo),
        value,
      ),
      declarado_completado: goal.estado === 'completado',
    };
  });
  const from = DateTime.fromISO(currentDay, { zone: user.zona_horaria })
    .minus({ days: days - 1 })
    .startOf('day')
    .toJSDate();
  return {
    inicial: dto(initial),
    actual: dto(current),
    mediciones: dto(measurements.filter((m) => m.fecha_medicion >= from)),
    objetivos: goalProgress,
    entrenamientos_semana: new Set(weekly.map((w) => w.fecha)).size,
    entrenamientos_completados: completed.length,
    historial_entrenamientos: dto(workouts.filter((w) => w.fecha_inicio >= from)),
    diferencia_peso: current && initial ? round(current.peso_kg - initial.peso_kg) : null,
  };
}
const getProgressImpl = (userId, days) =>
  readFitness(userId, (transaction, user) => progressData(userId, user, transaction, days));
export const getProgress = (...args) =>
  new Cliente({}, { verProgreso: () => getProgressImpl(...args) }).verProgreso();
