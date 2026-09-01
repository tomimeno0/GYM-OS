import { AppError } from '../controllers/errors.controller.js';

class UmlEntity {
  constructor(attributes = {}, operations = {}) {
    Object.assign(this, attributes);
    this.operations = operations;
  }

  execute(name, args) {
    const operation = this.operations[name];
    if (typeof operation !== 'function')
      throw new AppError(500, 'UML_OPERATION_MISSING', `No se configuró ${name}().`);
    return operation(...args);
  }
}

export class Usuario extends UmlEntity {
  iniciarSesion(...args) {
    return this.execute('iniciarSesion', args);
  }
  cerrarSesion(...args) {
    return this.execute('cerrarSesion', args);
  }
  recuperarPassword(...args) {
    return this.execute('recuperarPassword', args);
  }
}

export class Administrador extends UmlEntity {
  crearRoles(...args) {
    return this.execute('crearRoles', args);
  }
  asignarRoles(...args) {
    return this.execute('asignarRoles', args);
  }
  modificarRoles(...args) {
    return this.execute('modificarRoles', args);
  }
  activarUsuario(...args) {
    return this.execute('activarUsuario', args);
  }
  bloquearUsuario(...args) {
    return this.execute('bloquearUsuario', args);
  }
  eliminarUsuario(...args) {
    return this.execute('eliminarUsuario', args);
  }
}

export class Cliente extends UmlEntity {
  actualizarDatos(...args) {
    return this.execute('actualizarDatos', args);
  }
  verProgreso(...args) {
    return this.execute('verProgreso', args);
  }
}

export class PerfilFisico extends UmlEntity {
  cambiarPeso(...args) {
    return this.execute('cambiarPeso', args);
  }
  cambiarAltura(...args) {
    return this.execute('cambiarAltura', args);
  }
  cambiarPorcMusculo(...args) {
    return this.execute('cambiarPorcMusculo', args);
  }
  cambiarPorcGraso(...args) {
    return this.execute('cambiarPorcGraso', args);
  }
  cambiarNivelActividad(...args) {
    return this.execute('cambiarNivelActividad', args);
  }
}

export class Objetivo extends UmlEntity {
  definirObjeto(...args) {
    return this.execute('definirObjeto', args);
  }
  visuaizarObjetivo(...args) {
    return this.execute('visuaizarObjetivo', args);
  }
  marcarCompletado(...args) {
    return this.execute('marcarCompletado', args);
  }
  eliminarObjetivo(...args) {
    return this.execute('eliminarObjetivo', args);
  }
}

export class MedicionCorporal extends UmlEntity {
  actualizarMedicion(...args) {
    return this.execute('actualizarMedicion', args);
  }
}

export class Rutina extends UmlEntity {
  agregarEjercicio(...args) {
    return this.execute('agregarEjercicio', args);
  }
  eliminarEjercicio(...args) {
    return this.execute('eliminarEjercicio', args);
  }
  actualizarRutina(...args) {
    return this.execute('actualizarRutina', args);
  }
  generarConIA(...args) {
    return this.execute('generarConIA', args);
  }
  generarRutinaIA(...args) {
    return this.execute('generarRutinaIA', args);
  }
  modificarRutinaIA(...args) {
    return this.execute('modificarRutinaIA', args);
  }
  eliminarRutina(...args) {
    return this.execute('eliminarRutina', args);
  }
}

export class RutinaEjercicio extends UmlEntity {
  actualizarRutinaEjercicio(...args) {
    return this.execute('actualizarRutinaEjercicio', args);
  }
}

export class Dieta extends UmlEntity {
  calcularMacros(...args) {
    return this.execute('calcularMacros', args);
  }
  actualizarDieta(...args) {
    return this.execute('actualizarDieta', args);
  }
  generarConIA(...args) {
    return this.execute('generarConIA', args);
  }
  generarDietaIA(...args) {
    return this.execute('generarDietaIA', args);
  }
  modificarDietaIA(...args) {
    return this.execute('modificarDietaIA', args);
  }
  eliminarDieta(...args) {
    return this.execute('eliminarDieta', args);
  }
}

export class Comida extends UmlEntity {
  actualizarComida(...args) {
    return this.execute('actualizarComida', args);
  }
  calcularMacros(...args) {
    return this.execute('calcularMacros', args);
  }
}

export class RegistroEntrenamiento extends UmlEntity {
  actualizarRegistro(...args) {
    return this.execute('actualizarRegistro', args);
  }
}

export class IAService extends UmlEntity {
  generarRutina(...args) {
    return this.execute('generarRutina', args);
  }
  generarDieta(...args) {
    return this.execute('generarDieta', args);
  }
  responderConsulta(...args) {
    return this.execute('responderConsulta', args);
  }
  responderconsulta(...args) {
    return this.execute('responderconsulta', args);
  }
}

export class Progreso extends UmlEntity {
  calcularPorcentaje(...args) {
    return this.execute('calcularPorcentaje', args);
  }
}

export class Seguridad extends UmlEntity {
  encriptarRreversible(...args) {
    return this.execute('encriptarRreversible', args);
  }
  encriptarIrreversible(...args) {
    return this.execute('encriptarIrreversible', args);
  }
  digitoVerificador(...args) {
    return this.execute('digitoVerificador', args);
  }
  digitoVerificado(...args) {
    return this.execute('digitoVerificado', args);
  }
}

export const UML_METHODS = Object.freeze({
  Usuario: ['iniciarSesion', 'cerrarSesion', 'recuperarPassword'],
  Administrador: [
    'crearRoles',
    'asignarRoles',
    'modificarRoles',
    'activarUsuario',
    'bloquearUsuario',
    'eliminarUsuario',
  ],
  Cliente: ['actualizarDatos', 'verProgreso'],
  PerfilFisico: [
    'cambiarPeso',
    'cambiarAltura',
    'cambiarPorcMusculo',
    'cambiarPorcGraso',
    'cambiarNivelActividad',
  ],
  Objetivo: ['definirObjeto', 'visuaizarObjetivo', 'marcarCompletado', 'eliminarObjetivo'],
  MedicionCorporal: ['actualizarMedicion'],
  Rutina: ['agregarEjercicio', 'eliminarEjercicio', 'actualizarRutina', 'generarConIA'],
  RutinaEjercicio: ['actualizarRutinaEjercicio'],
  Dieta: ['calcularMacros', 'actualizarDieta', 'generarConIA'],
  Comida: ['actualizarComida', 'calcularMacros'],
  RegistroEntrenamiento: ['actualizarRegistro'],
  IAService: ['generarRutina', 'generarDieta', 'responderConsulta'],
  Progreso: ['calcularPorcentaje'],
  Seguridad: ['encriptarRreversible', 'encriptarIrreversible', 'digitoVerificador'],
});

export const SEQUENCE_METHODS = Object.freeze({
  Rutina: ['generarRutinaIA', 'modificarRutinaIA', 'eliminarRutina'],
  Dieta: ['generarDietaIA', 'modificarDietaIA', 'eliminarDieta'],
  IAService: ['responderconsulta'],
  Seguridad: ['digitoVerificado'],
});
