import test from 'node:test';
import assert from 'node:assert/strict';
import * as uml from '../../api/domain/uml.js';

test('the source UML class and method names exist literally and execute their operation', async () => {
  for (const [className, methods] of Object.entries(uml.UML_METHODS)) {
    const Type = uml[className];
    assert.equal(typeof Type, 'function', `${className} class`);
    for (const method of methods) {
      assert.equal(typeof Type.prototype[method], 'function', `${className}.${method}`);
      const expected = `${className}.${method}`;
      const instance = new Type({}, { [method]: (...args) => [expected, ...args] });
      assert.deepEqual(await instance[method]('ok'), [expected, 'ok']);
    }
  }
});

test('the exact sequence-only message names exist and execute', async () => {
  for (const [className, methods] of Object.entries(uml.SEQUENCE_METHODS)) {
    const Type = uml[className];
    for (const method of methods) {
      assert.equal(typeof Type.prototype[method], 'function', `${className}.${method}`);
      const instance = new Type({}, { [method]: (...args) => [className, method, ...args] });
      assert.deepEqual(await instance[method]('ok'), [className, method, 'ok']);
    }
  }
});

const bindings = {
  Usuario: {
    iniciarSesion: ['accounts', 'login'],
    cerrarSesion: ['accounts', 'logout'],
    recuperarPassword: ['accounts', 'requestRecovery'],
  },
  Administrador: {
    crearRoles: ['admin', 'saveRole'],
    asignarRoles: ['admin', 'assignRoles'],
    modificarRoles: ['admin', 'saveRole'],
    activarUsuario: ['admin', 'changeStatus'],
    bloquearUsuario: ['admin', 'changeStatus'],
    eliminarUsuario: ['admin', 'removeUser'],
  },
  Cliente: {
    actualizarDatos: ['accounts', 'updateProfile'],
    verProgreso: ['fitness', 'getProgress'],
  },
  PerfilFisico: {
    cambiarPeso: ['fitness', 'addMeasurement'],
    cambiarAltura: ['fitness', 'addMeasurement'],
    cambiarPorcMusculo: ['fitness', 'addMeasurement'],
    cambiarPorcGraso: ['fitness', 'addMeasurement'],
    cambiarNivelActividad: ['fitness', 'addMeasurement'],
  },
  Objetivo: {
    definirObjeto: ['fitness', 'createGoal'],
    visuaizarObjetivo: ['fitness', 'listGoals'],
    marcarCompletado: ['fitness', 'completeGoal'],
    eliminarObjetivo: ['fitness', 'removeGoal'],
  },
  MedicionCorporal: { actualizarMedicion: ['fitness', 'addMeasurement'] },
  Rutina: {
    agregarEjercicio: ['routines', 'saveRoutine'],
    eliminarEjercicio: ['routines', 'saveRoutine'],
    actualizarRutina: ['routines', 'saveRoutine'],
    generarConIA: ['ai', 'generateRoutine'],
  },
  RutinaEjercicio: { actualizarRutinaEjercicio: ['routines', 'saveRoutine'] },
  Dieta: {
    calcularMacros: ['nutrition', 'calculateMacros'],
    actualizarDieta: ['nutrition', 'saveDiet'],
    generarConIA: ['ai', 'generateDiet'],
  },
  Comida: {
    actualizarComida: ['nutrition', 'saveConsumed'],
    calcularMacros: ['nutrition', 'calculateMacros'],
  },
  RegistroEntrenamiento: { actualizarRegistro: ['workouts', 'saveWorkout'] },
  IAService: {
    generarRutina: ['ai', 'generateRoutine'],
    generarDieta: ['ai', 'generateDiet'],
    responderConsulta: ['ai', 'chat'],
  },
  Progreso: { calcularPorcentaje: ['fitness', 'getProgress'] },
  Seguridad: {
    encriptarRreversible: ['security', 'encrypt'],
    encriptarIrreversible: ['security', 'hashPassword'],
    digitoVerificador: ['security', 'signature'],
  },
};

test('every UML method has an explicit callable service binding', async () => {
  const modules = Object.fromEntries(
    await Promise.all(
      [
        ...new Set(
          Object.values(bindings).flatMap((value) => Object.values(value).map(([m]) => m)),
        ),
      ].map(async (name) => [name, await import(`../../api/services/${name}.js`)]),
    ),
  );
  assert.deepEqual(Object.keys(bindings), Object.keys(uml.UML_METHODS));
  for (const [className, methods] of Object.entries(uml.UML_METHODS)) {
    assert.deepEqual(Object.keys(bindings[className]), methods, `${className} binding list`);
    for (const method of methods) {
      const [moduleName, exportName] = bindings[className][method];
      assert.equal(typeof modules[moduleName][exportName], 'function', `${className}.${method}`);
    }
  }
});
