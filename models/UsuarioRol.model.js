import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const UsuarioRol = sequelize.define('usuario_roles', schema.usuario_roles, {
  indexes: indexes.usuario_roles || [],
});
