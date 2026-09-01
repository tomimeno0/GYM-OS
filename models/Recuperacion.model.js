import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Recuperacion = sequelize.define('recuperaciones', schema.recuperaciones, {
  indexes: indexes.recuperaciones || [],
});
