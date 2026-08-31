import { Op } from 'sequelize';
import { models } from '../models/index.js';
import {
  dto,
  owned,
  readFitness,
  writeFitness,
  today,
  dayRange,
  notFuture,
  requireActive,
  round,
} from '../lib/domain.js';
import { assert } from '../lib/errors.js';
import { validateGoalLink } from './fitness.js';
import { Comida, Dieta } from '../domain/uml.js';

const { dietas: Diets, dieta_comidas: Meals, comidas_consumidas: Consumed } = models;
// Values are PER 100 g/ml or PER ONE portion; quantities are never summed across incompatible units.
function calculateMacrosImpl(foods) {
  const total = { calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 };
  for (const food of foods) {
    const factor = food.cantidad / (food.unidad === 'porcion' ? 1 : 100);
    for (const key of Object.keys(total)) total[key] += food[key] * factor;
  }
  for (const key of Object.keys(total)) {
    assert(
      Number.isFinite(total[key]) &&
        total[key] >= 0 &&
        total[key] <= (key === 'calorias' ? 100000 : 9999.99),
      400,
      'MACRO_RANGE',
      'Las cantidades o los valores nutricionales exceden el rango admitido.',
    );
    total[key] = key === 'calorias' ? Math.round(total[key]) : round(total[key]);
  }
  return total;
}
export const calculateMacros = (...args) =>
  new Dieta(
    {},
    {
      calcularMacros: () =>
        new Comida({}, { calcularMacros: () => calculateMacrosImpl(...args) }).calcularMacros(),
    },
  ).calcularMacros();
export async function dietDetail(id, userId, transaction) {
  const diet = await owned(Diets, id, userId, transaction, {
    where: { estado: { [Op.ne]: 'eliminada' } },
  });
  const meals = await Meals.findAll({
    where: { dieta_id: id },
    order: [
      ['hora', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });
  const totales = { calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 };
  for (const meal of meals)
    for (const key of Object.keys(totales)) totales[key] = round(totales[key] + Number(meal[key]));
  return { ...dto(diet), comidas: dto(meals), totales };
}
export const getDiet = (userId, id) =>
  readFitness(userId, (transaction) => dietDetail(id, userId, transaction));
export const listDiets = (userId) =>
  readFitness(userId, async (transaction) => {
    const diets = await Diets.findAll({
      where: { usuario_id: userId, estado: { [Op.ne]: 'eliminada' } },
      order: [['fecha_creacion', 'DESC']],
      transaction,
    });
    const items = [];
    for (const d of diets) items.push(await dietDetail(d.id, userId, transaction));
    return { items };
  });
export async function persistDiet(userId, data, id, transaction, generation = 'manual') {
  await validateGoalLink(data.objetivo_id, userId, transaction);
  const { comidas, ...fields } = data;
  const prepared = comidas.map((meal) =>
    new Comida(
      {},
      {
        actualizarComida: () => ({
          ...meal,
          ...calculateMacros(meal.alimentos),
          cantidad: 1,
          unidad: 'comida',
        }),
      },
    ).actualizarComida(),
  );
  let diet;
  if (id) {
    diet = await owned(Diets, id, userId, transaction);
    requireActive(diet);
    await diet.update(
      {
        ...fields,
        tipo_generacion: generation,
        fecha_actualizacion: new Date(),
      },
      { transaction },
    );
    await Meals.destroy({ where: { dieta_id: id }, transaction });
  } else
    diet = await Diets.create(
      {
        ...fields,
        usuario_id: userId,
        tipo_generacion: generation,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
      },
      { transaction },
    );
  await Meals.bulkCreate(
    prepared.map((m) => ({ ...m, dieta_id: diet.id })),
    { transaction },
  );
  return dietDetail(diet.id, userId, transaction);
}
const saveDietImpl = (userId, data, id) =>
  writeFitness(
    userId,
    id ? 'CU027_MODIFICAR_DIETA' : 'CU024_CREAR_DIETA',
    'nutricion',
    (transaction) => persistDiet(userId, data, id, transaction),
  );
export const saveDiet = (...args) =>
  new Dieta({}, { actualizarDieta: () => saveDietImpl(...args) }).actualizarDieta();
export const saveAiDiet = (userId, data, id, action) =>
  writeFitness(userId, action, 'ia', (transaction) =>
    persistDiet(userId, data, id, transaction, 'ia'),
  );
export const removeDiet = (userId, id) =>
  new Dieta(
    {},
    {
      eliminarDieta: () =>
        writeFitness(userId, 'CU028_ELIMINAR_DIETA', 'nutricion', async (transaction) => {
          const diet = await owned(Diets, id, userId, transaction);
          requireActive(diet);
          return diet.update(
            { estado: 'eliminada', fecha_actualizacion: new Date() },
            { transaction },
          );
        }),
    },
  ).eliminarDieta();
export const saveConsumed = (userId, data, id) =>
  writeFitness(userId, 'CU029_REGISTRAR_COMIDA', 'nutricion', async (transaction) => {
    notFuture(data.fecha_consumo);
    const totals = calculateMacros(data.alimentos);
    const fields = {
      ...data,
      fecha_consumo: new Date(data.fecha_consumo),
      cantidad_consumida: 1,
      unidad: 'comida',
      calorias_totales: totals.calorias,
      proteinas_totales_g: totals.proteinas_g,
      carbohidratos_totales_g: totals.carbohidratos_g,
      grasas_totales_g: totals.grasas_g,
    };
    if (id) return (await owned(Consumed, id, userId, transaction)).update(fields, { transaction });
    return Consumed.create({ ...fields, usuario_id: userId }, { transaction });
  });
export const removeConsumed = (userId, id) =>
  writeFitness(userId, 'CU029_ELIMINAR_REGISTRO', 'nutricion', async (transaction) => {
    await (await owned(Consumed, id, userId, transaction)).destroy({ transaction });
    return null;
  });
export async function nutritionData(userId, user, transaction, date, dietId) {
  const day = date || today(user.zona_horaria),
    { start, end } = dayRange(day, user.zona_horaria);
  const entries = await Consumed.findAll({
    where: { usuario_id: userId, fecha_consumo: { [Op.gte]: start, [Op.lt]: end } },
    order: [['fecha_consumo', 'ASC']],
    transaction,
  });
  const diet = dietId
    ? await owned(Diets, dietId, userId, transaction, { where: { estado: 'activa' } })
    : await Diets.findOne({
        where: { usuario_id: userId, estado: 'activa' },
        order: [['fecha_creacion', 'DESC']],
        transaction,
      });
  const totals = { calorias: 0, proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 };
  for (const meal of entries) {
    totals.calorias += meal.calorias_totales;
    for (const key of ['proteinas', 'carbohidratos', 'grasas'])
      totals[key + '_g'] = round(totals[key + '_g'] + Number(meal[key + '_totales_g']));
  }
  return {
    fecha: day,
    zona_horaria: user.zona_horaria,
    comidas: dto(entries),
    totales: totals,
    dieta: diet ? await dietDetail(diet.id, userId, transaction) : null,
  };
}
// CU030 explicitly requires a read audit event; this is a transaction because it writes the event.
export const getNutrition = (userId, day, dietId) =>
  writeFitness(userId, 'CU030_CONSULTAR_MACROS', 'nutricion', (transaction, user) =>
    nutritionData(userId, user, transaction, day, dietId),
  );
