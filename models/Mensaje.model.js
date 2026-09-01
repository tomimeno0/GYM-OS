import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Mensaje = sequelize.define('mensajes', schema.mensajes, {
  indexes: indexes.mensajes || [],
});
