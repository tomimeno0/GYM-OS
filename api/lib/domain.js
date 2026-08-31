import { DateTime } from 'luxon';
import { atomic, verified, audit } from '../services/integrity.js';
import { authorizeActor } from '../services/admin.js';
import { assert } from './errors.js';

export const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
export function dto(value) {
  if (value?.get) return dto(value.get({ plain: true }));
  if (Array.isArray(value)) return value.map(dto);
  if (value instanceof Date || !value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !['dvh', 'usuario_activo', 'usuario_en_curso'].includes(key))
      .map(([key, v]) => [key, dto(v)]),
  );
}
export async function owned(model, id, userId, transaction, extra = {}) {
  const item = await model.findOne({
    ...extra,
    where: { ...extra.where, id, usuario_id: userId },
    transaction,
  });
  assert(item, 404, 'NOT_FOUND', 'No se encontró el registro.');
  return item;
}
export const readFitness = (userId, work) =>
  verified(async (transaction) => {
    const user = await authorizeActor(userId, 'fitness:use', transaction);
    return work(transaction, user);
  });
export const writeFitness = (userId, action, module, work) =>
  atomic(async (transaction) => {
    const user = await authorizeActor(userId, 'fitness:use', transaction);
    const result = await work(transaction, user);
    await audit(transaction, userId, action, module);
    return dto(result);
  });
export function today(zone) {
  return DateTime.now().setZone(zone).toISODate();
}
export function dayRange(day, zone) {
  const start = DateTime.fromISO(day, { zone }).startOf('day');
  assert(start.isValid, 400, 'INVALID_DATE', 'La fecha no es válida.');
  return { start: start.toJSDate(), end: start.plus({ days: 1 }).toJSDate() };
}
export function notFuture(value) {
  assert(
    new Date(value).getTime() <= Date.now() + 60000,
    400,
    'FUTURE_DATE',
    'No se puede registrar una fecha futura.',
  );
}
export function requireActive(item) {
  assert(
    ['activo', 'activa'].includes(item.estado),
    409,
    'INACTIVE_RECORD',
    'El registro ya no está activo.',
  );
}
