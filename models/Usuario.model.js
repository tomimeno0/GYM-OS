import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Usuario = sequelize.define('usuarios', schema.usuarios, {
  indexes: indexes.usuarios || [],
});
