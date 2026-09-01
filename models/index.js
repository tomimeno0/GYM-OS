import { Usuario } from './Usuario.model.js';
import { Rol } from './Rol.model.js';
import { UsuarioRol } from './UsuarioRol.model.js';
import { MedicionFisica } from './MedicionFisica.model.js';
import { Objetivo } from './Objetivo.model.js';
import { Rutina } from './Rutina.model.js';
import { RutinaEjercicio } from './RutinaEjercicio.model.js';
import { Entrenamiento } from './Entrenamiento.model.js';
import { EntrenamientoEjercicio } from './EntrenamientoEjercicio.model.js';
import { Dieta } from './Dieta.model.js';
import { DietaComida } from './DietaComida.model.js';
import { ComidaConsumida } from './ComidaConsumida.model.js';
import { Sesion } from './Sesion.model.js';
import { Recuperacion } from './Recuperacion.model.js';
import { Conversacion } from './Conversacion.model.js';
import { Mensaje } from './Mensaje.model.js';
import { Bitacora } from './Bitacora.model.js';
import { Integrity } from './Integrity.model.js';

export const models = {
  usuarios: Usuario,
  roles: Rol,
  usuario_roles: UsuarioRol,
  mediciones_fisicas: MedicionFisica,
  objetivos: Objetivo,
  rutinas: Rutina,
  rutina_ejercicios: RutinaEjercicio,
  entrenamientos: Entrenamiento,
  entrenamiento_ejercicios: EntrenamientoEjercicio,
  dietas: Dieta,
  dieta_comidas: DietaComida,
  comidas_consumidas: ComidaConsumida,
  sesiones: Sesion,
  recuperaciones: Recuperacion,
  conversaciones: Conversacion,
  mensajes: Mensaje,
  bitacora: Bitacora,
};

export { Integrity };

models.usuarios.belongsToMany(models.roles, {
  through: models.usuario_roles,
  foreignKey: 'usuario_id',
  otherKey: 'rol_id',
  as: 'roles',
});
models.rutinas.hasMany(models.rutina_ejercicios, { foreignKey: 'rutina_id', as: 'ejercicios' });
models.dietas.hasMany(models.dieta_comidas, { foreignKey: 'dieta_id', as: 'comidas' });
models.entrenamientos.hasMany(models.entrenamiento_ejercicios, {
  foreignKey: 'entrenamiento_id',
  as: 'ejercicios',
});
models.conversaciones.hasMany(models.mensajes, {
  foreignKey: 'conversacion_id',
  as: 'mensajes',
});
