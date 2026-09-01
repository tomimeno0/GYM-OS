import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Entrenamiento = sequelize.define('entrenamientos', schema.entrenamientos, {
  indexes: indexes.entrenamientos || [],
});
