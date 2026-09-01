import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Sesion = sequelize.define('sesiones', schema.sesiones, {
  indexes: indexes.sesiones || [],
});
