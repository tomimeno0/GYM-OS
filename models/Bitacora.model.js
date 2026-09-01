import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Bitacora = sequelize.define('bitacora', schema.bitacora, {
  indexes: indexes.bitacora || [],
});
