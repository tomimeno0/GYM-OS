import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const MedicionFisica = sequelize.define('mediciones_fisicas', schema.mediciones_fisicas, {
  indexes: indexes.mediciones_fisicas || [],
});
