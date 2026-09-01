import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Dieta = sequelize.define('dietas', schema.dietas, {
  indexes: indexes.dietas || [],
});
