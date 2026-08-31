import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAiRoutine, validateAiDiet } from '../../api/services/ai.js';

const routine = {
  nombre: 'Rutina segura',
  descripcion: 'Prueba',
  ejercicios: [
    {
      nombre_ejercicio: 'Sentadilla',
      grupo_muscular: 'Piernas',
      dia_semana: 'lunes',
      orden: 0,
      series: 3,
      repeticiones: 10,
      peso_sugerido_kg: 20,
      descanso_segundos: 90,
      observaciones: '',
    },
  ],
};
const diet = {
  nombre: 'Dieta segura',
  descripcion: 'Prueba',
  calorias_objetivo: 2000,
  proteinas_objetivo_g: 140,
  carbohidratos_objetivo_g: 220,
  grasas_objetivo_g: 65,
  comidas: [
    {
      nombre_comida: 'Desayuno',
      tipo_comida: 'desayuno',
      hora: '08:00',
      observaciones: '',
      alimentos: [
        {
          nombre: 'Avena',
          cantidad: 60,
          unidad: 'g',
          calorias: 389,
          proteinas_g: 16.9,
          carbohidratos_g: 66.3,
          grasas_g: 6.9,
          fuente: 'Referencia',
        },
      ],
    },
  ],
};

test('AI plan safety accepts conservative plans and rejects unsafe values', () => {
  assert.deepEqual(validateAiRoutine(routine), routine);
  assert.throws(
    () => validateAiRoutine({ ...routine, ejercicios: [{ ...routine.ejercicios[0], series: 11 }] }),
    (error) => error.code === 'AI_UNSAFE_RESPONSE',
  );
  assert.deepEqual(validateAiDiet(diet), diet);
  assert.throws(
    () => validateAiDiet({ ...diet, calorias_objetivo: 500 }),
    (error) => error.code === 'AI_UNSAFE_RESPONSE',
  );
});
