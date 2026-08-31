import { DataTypes as D } from 'sequelize';
import { sequelize } from '../config/database.js';
import { schema, indexes } from '../db/schema.js';
export const models = Object.fromEntries(Object.entries(schema).map(([table, fields]) => [table, sequelize.define(table, fields, { indexes: indexes[table] || [] })]));
export const Integrity = sequelize.define('digitos_verificadores', {
  nombre_tabla: { type: D.STRING(100), primaryKey: true }, dvv: { type: D.STRING(64), allowNull: false }, fecha_actualizacion: { type: D.DATE(3), allowNull: false },
});
models.usuarios.belongsToMany(models.roles, { through: models.usuario_roles, foreignKey: 'usuario_id', otherKey: 'rol_id', as: 'roles' });
models.rutinas.hasMany(models.rutina_ejercicios, { foreignKey: 'rutina_id', as: 'ejercicios' });
models.dietas.hasMany(models.dieta_comidas, { foreignKey: 'dieta_id', as: 'comidas' });
models.entrenamientos.hasMany(models.entrenamiento_ejercicios, { foreignKey: 'entrenamiento_id', as: 'ejercicios' });
models.conversaciones.hasMany(models.mensajes, { foreignKey: 'conversacion_id', as: 'mensajes' });
