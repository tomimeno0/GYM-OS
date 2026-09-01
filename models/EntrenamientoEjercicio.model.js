import { sequelize } from '../config/db.js';
import { schema, indexes } from '../config/schema.js';

export const EntrenamientoEjercicio = sequelize.define(
  'entrenamiento_ejercicios',
  schema.entrenamiento_ejercicios,
  {
    indexes: indexes.entrenamiento_ejercicios || [],
  },
);
