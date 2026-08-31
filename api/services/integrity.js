import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../config/database.js';
import { schema } from '../db/schema.js';
import { Integrity, models } from '../models/index.js';
import { signature } from './security.js';
import { AppError } from '../lib/errors.js';

const tables = Object.keys(schema);
async function rowsOf(table, transaction) {
  return sequelize.query(`SELECT * FROM \`${table}\` ORDER BY id`, {
    type: QueryTypes.SELECT,
    transaction,
  });
}
function rowHash(row, omitted = []) {
  const { dvh, ...data } = row;
  for (const key of omitted) delete data[key];
  return signature(data);
}
function columnHash(rows) {
  return signature(rows.map(({ id, dvh }) => ({ id, dvh })));
}
export async function inspectIntegrity(transaction, tableNames = tables, omittedColumns = {}) {
  const result = [];
  for (const table of tableNames) {
    const rows = await rowsOf(table, transaction);
    const record = await Integrity.findByPk(table, { transaction });
    const altered = rows
      .filter((row) => row.dvh !== rowHash(row, omittedColumns[table]))
      .map((row) => row.id);
    result.push({
      tabla: table,
      filas: rows.length,
      filas_alteradas: altered,
      columna_valida: record?.dvv === columnHash(rows),
      ok: altered.length === 0 && record?.dvv === columnHash(rows),
    });
  }
  return { ok: result.every((r) => r.ok), tablas: result };
}
export async function signDatabase(transaction) {
  for (const table of tables) {
    const rows = await rowsOf(table, transaction);
    for (const row of rows) {
      const hash = rowHash(row);
      if (row.dvh !== hash)
        await sequelize.query(`UPDATE \`${table}\` SET dvh = :dvh WHERE id = :id`, {
          replacements: { dvh: hash, id: row.id },
          transaction,
        });
      row.dvh = hash;
    }
    await Integrity.upsert(
      { nombre_tabla: table, dvv: columnHash(rows), fecha_actualizacion: new Date() },
      { transaction },
    );
  }
}
export async function atomic(work) {
  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (transaction) => {
      const mutex = await Integrity.findByPk('__mutex__', {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!mutex) throw new AppError(503, 'DB_NOT_READY', 'La base de datos necesita migraciones.');
      const report = await inspectIntegrity(transaction);
      if (!report.ok)
        throw new AppError(
          503,
          'INTEGRITY_ERROR',
          'Se detectó una alteración de integridad. Contactá al administrador.',
        );
      const result = await work(transaction);
      await signDatabase(transaction);
      return result;
    },
  );
}
export async function verified(work, tableNames = tables) {
  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
    async (transaction) => {
      const mutex = await Integrity.findByPk('__mutex__', {
        transaction,
        lock: transaction.LOCK.SHARE,
      });
      if (!mutex) throw new AppError(503, 'DB_NOT_READY', 'La base de datos necesita migraciones.');
      if (!(await inspectIntegrity(transaction, tableNames)).ok)
        throw new AppError(
          503,
          'INTEGRITY_ERROR',
          'Se detectó una alteración de integridad. Contactá al administrador.',
        );
      return work(transaction);
    },
  );
}
export async function audit(
  transaction,
  usuario_id,
  accion,
  modulo,
  resultado = 'exitoso',
  descripcion = '',
) {
  return models.bitacora.create(
    { usuario_id, accion, modulo, resultado, descripcion, fecha_hora: new Date() },
    { transaction },
  );
}
