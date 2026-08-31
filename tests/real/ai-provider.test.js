import test from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../../api/config/env.js';
import { cohereChat } from '../../api/services/cohere.js';
import {
  routineJsonSchema,
  dietJsonSchema,
  chatJsonSchema,
  validateAiRoutine,
  validateAiDiet,
} from '../../api/services/ai.js';

const real = process.env.RUN_REAL_AI === 'true';
const context = {
  measurement: { peso_kg: 80, altura_cm: 175, nivel_actividad: 'media' },
  goal: { nombre: 'Mejorar condición', tipo: 'mejorar_resistencia', frecuencia_semanal: 3 },
};

test(
  'real Cohere accepts every production structured-output contract',
  { skip: !real },
  async () => {
    assert.ok(env.ai.apiKey, 'COHERE_API_KEY is required for the real provider test');
    const routine = JSON.parse(
      await cohereChat(
        [
          {
            role: 'system',
            content:
              'Generá una rutina segura, no médica. Cada ejercicio debe tener 1 a 10 series, 1 a 50 repeticiones, 0 a 500 kg y 15 a 600 segundos de descanso. Respondé solo el JSON solicitado.',
          },
          {
            role: 'user',
            content: JSON.stringify({ contexto: context, preferencias: 'tres días' }),
          },
        ],
        routineJsonSchema,
      ),
    );
    validateAiRoutine(routine);

    const diet = JSON.parse(
      await cohereChat(
        [
          {
            role: 'system',
            content:
              'Generá una dieta orientativa de 2000 a 2400 kcal con macros coherentes. Respondé solo el JSON solicitado.',
          },
          { role: 'user', content: JSON.stringify({ contexto: context, preferencias: 'simple' }) },
        ],
        dietJsonSchema,
      ),
    );
    validateAiDiet(diet);

    const chat = JSON.parse(
      await cohereChat(
        [
          {
            role: 'system',
            content: 'Respondé relacionado=true y una respuesta breve en español.',
          },
          { role: 'user', content: '¿Cuánto descanso entre series?' },
        ],
        chatJsonSchema,
      ),
    );
    assert.equal(chat.relacionado, true);
    assert.equal(typeof chat.respuesta, 'string');
    assert.ok(chat.respuesta.trim());
  },
);
