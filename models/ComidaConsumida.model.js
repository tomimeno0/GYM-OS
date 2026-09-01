import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const ComidaConsumida = sequelize.define('comidas_consumidas', schema.comidas_consumidas, {
  indexes: indexes.comidas_consumidas || [],
});
