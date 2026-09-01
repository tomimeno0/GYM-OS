import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const RutinaEjercicio = sequelize.define('rutina_ejercicios', schema.rutina_ejercicios, {
  indexes: indexes.rutina_ejercicios || [],
});
