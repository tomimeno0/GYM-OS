import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const DietaComida = sequelize.define('dieta_comidas', schema.dieta_comidas, {
  indexes: indexes.dieta_comidas || [],
});
