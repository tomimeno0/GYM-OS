import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  dialect: 'mysql', host: env.db.host, port: env.db.port, logging: false, timezone: '+00:00',
  dialectOptions: { decimalNumbers: true, dateStrings: false },
  define: { timestamps: false, freezeTableName: true, charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  pool: { min: 0, max: 8, idle: 10000 },
});
