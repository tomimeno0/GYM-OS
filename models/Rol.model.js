import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Rol = sequelize.define('roles', schema.roles, {
  indexes: indexes.roles || [],
});
