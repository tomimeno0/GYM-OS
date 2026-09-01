import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const Objetivo = sequelize.define('objetivos', schema.objetivos, {
  indexes: indexes.objetivos || [],
});
