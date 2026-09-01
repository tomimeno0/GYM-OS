import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Rutina = sequelize.define('rutinas', schema.rutinas, {
  indexes: indexes.rutinas || [],
});
