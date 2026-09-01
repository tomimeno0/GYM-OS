import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Conversacion = sequelize.define('conversaciones', schema.conversaciones, {
  indexes: indexes.conversaciones || [],
});
