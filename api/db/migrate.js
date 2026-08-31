import { DataTypes as D } from 'sequelize';
import { pathToFileURL } from 'node:url';
import { sequelize } from '../config/database.js';
import { initialSchema as schema, indexes, fitnessColumns } from './schema.js';
import { Integrity } from '../models/index.js';
import { signDatabase, inspectIntegrity } from '../services/integrity.js';

export async function migrate() {
  await sequelize.authenticate();
  const qi = sequelize.getQueryInterface();
  await qi.createTable('schema_migrations', {
    nombre: { type: D.STRING(100), primaryKey: true },
    fecha: { type: D.DATE, allowNull: false },
  });
  const [existing] = await sequelize.query(
    "SELECT nombre FROM schema_migrations WHERE nombre = '001-initial'",
  );
  if (existing.length) {
    await migrateFitness(qi);
    return;
  }
  // DDL is not transactional in MySQL. Each operation is idempotent to recover a failed initial migration.
  for (const [table, fields] of Object.entries(schema)) {
    await qi.createTable(table, fields, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      engine: 'InnoDB',
    });
    const current = await qi.showIndex(table);
    for (const [i, index] of (indexes[table] || []).entries()) {
      const name = `${table}_idx_${i}`;
      if (!current.some((v) => v.name === name)) await qi.addIndex(table, { ...index, name });
    }
  }
  await qi.createTable('digitos_verificadores', Integrity.rawAttributes, { engine: 'InnoDB' });
  await sequelize.transaction(async (transaction) => {
    const [counts] = await sequelize.query('SELECT COUNT(*) AS n FROM usuarios', { transaction });
    if (Number(counts[0].n))
      throw new Error(
        'La migración inicial no firma una base con usuarios preexistentes. Revisar manualmente.',
      );
    await Integrity.upsert(
      { nombre_tabla: '__mutex__', dvv: 'initial-lock', fecha_actualizacion: new Date() },
      { transaction },
    );
    await signDatabase(transaction);
    await sequelize.query(
      "INSERT INTO schema_migrations (nombre, fecha) VALUES ('001-initial', NOW())",
      { transaction },
    );
  });
  await migrateFitness(qi);
}
async function migrateFitness(qi) {
  const [done] = await sequelize.query(
    "SELECT nombre FROM schema_migrations WHERE nombre = '002-fitness-progress'",
  );
  if (done.length) return;
  const omitted = Object.fromEntries(
    Object.entries(fitnessColumns).map(([table, fields]) => [table, Object.keys(fields)]),
  );
  if (!(await inspectIntegrity(undefined, Object.keys(schema), omitted)).ok)
    throw new Error('La migración requiere integridad válida del esquema anterior.');
  // Run migrations with the API stopped. DDL commits in MySQL; null checks make interrupted retries safe.
  for (const [table, columns] of Object.entries(fitnessColumns)) {
    const current = await qi.describeTable(table);
    for (const [name, definition] of Object.entries(columns)) {
      if (!current[name]) await qi.addColumn(table, name, definition);
      else {
        const [rows] = await sequelize.query(
          `SELECT COUNT(*) AS n FROM \`${table}\` WHERE \`${name}\` IS NOT NULL`,
        );
        if (Number(rows[0].n))
          throw new Error('Columna nueva con datos inesperados: revisar migración interrumpida.');
      }
    }
  }
  await sequelize.transaction(async (transaction) => {
    await signDatabase(transaction);
    await sequelize.query(
      "INSERT INTO schema_migrations (nombre, fecha) VALUES ('002-fitness-progress', NOW())",
      { transaction },
    );
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await migrate();
    console.log('Migraciones aplicadas.');
  } finally {
    await sequelize.close();
  }
}
