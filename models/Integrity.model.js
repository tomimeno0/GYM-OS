import { DataTypes as D } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Integrity = sequelize.define('digitos_verificadores', {
  nombre_tabla: { type: D.STRING(100), primaryKey: true },
  dvv: { type: D.STRING(64), allowNull: false },
  fecha_actualizacion: { type: D.DATE(3), allowNull: false },
});
