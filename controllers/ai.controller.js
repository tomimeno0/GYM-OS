import { routineSchema, dietSchema } from '@gym-os/shared/schemas';
import { env } from '../config/env.js';
import { Dieta, IAService, Rutina } from '../models/uml.model.js';
import { dto, readFitness, writeFitness } from '../controllers/domain.controller.js';
import { AppError, assert } from './errors.controller.js';
import { models } from '../models/index.js';
import { cohereChat } from './cohere.controller.js';
import { routineDetail, saveAiRoutine } from './routines.controller.js';
import { dietDetail, saveAiDiet } from './nutrition.controller.js';

const {
  mediciones_fisicas: Measurements,
  objetivos: Goals,
  rutinas: Routines,
  dietas: Diets,
  entrenamientos: Workouts,
  usuarios: Users,
  conversaciones: Conversations,
  mensajes: Messages,
} = models;

export const routineJsonSchema = {
  type: 'object',
  required: ['nombre', 'descripcion', 'ejercicios'],
  properties: {
    nombre: { type: 'string' },
    descripcion: { type: 'string' },
    ejercicios: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'nombre_ejercicio',
          'grupo_muscular',
          'dia_semana',
          'orden',
          'series',
          'repeticiones',
          'peso_sugerido_kg',
          'descanso_segundos',
          'observaciones',
        ],
        properties: {
          nombre_ejercicio: { type: 'string' },
          grupo_muscular: { type: 'string' },
          dia_semana: {
            type: 'string',
            enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
          },
          orden: { type: 'integer' },
          series: { type: 'integer' },
          repeticiones: { type: 'integer' },
          peso_sugerido_kg: { type: 'number' },
          descanso_segundos: { type: 'integer' },
          observaciones: { type: 'string' },
        },
      },
    },
  },
};
const foodProperties = {
  nombre: { type: 'string' },
  cantidad: { type: 'number' },
  unidad: { type: 'string', enum: ['g', 'ml', 'porcion'] },
  calorias: { type: 'number' },
  proteinas_g: { type: 'number' },
  carbohidratos_g: { type: 'number' },
  grasas_g: { type: 'number' },
  fuente: { type: 'string' },
};
export const dietJsonSchema = {
  type: 'object',
  required: [
    'nombre',
    'descripcion',
    'calorias_objetivo',
    'proteinas_objetivo_g',
    'carbohidratos_objetivo_g',
    'grasas_objetivo_g',
    'comidas',
  ],
  properties: {
    nombre: { type: 'string' },
    descripcion: { type: 'string' },
    calorias_objetivo: { type: 'number' },
    proteinas_objetivo_g: { type: 'number' },
    carbohidratos_objetivo_g: { type: 'number' },
    grasas_objetivo_g: { type: 'number' },
    comidas: {
      type: 'array',
      items: {
        type: 'object',
        required: ['nombre_comida', 'tipo_comida', 'hora', 'alimentos', 'observaciones'],
        properties: {
          nombre_comida: { type: 'string' },
          tipo_comida: {
            type: 'string',
            enum: ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion'],
          },
          hora: { type: 'string' },
          observaciones: { type: 'string' },
          alimentos: {
            type: 'array',
            items: {
              type: 'object',
              required: Object.keys(foodProperties),
              properties: foodProperties,
            },
          },
        },
      },
    },
  },
};
export const chatJsonSchema = {
  type: 'object',
  required: ['relacionado', 'respuesta'],
  properties: { relacionado: { type: 'boolean' }, respuesta: { type: 'string' } },
};

function parseJson(text, schema, objectiveId) {
  try {
    return schema.parse({
      ...JSON.parse(text),
      ...(objectiveId ? { objetivo_id: objectiveId } : {}),
    });
  } catch {
    throw new AppError(
      503,
      'AI_INVALID_RESPONSE',
      'El asistente no pudo crear un plan válido. Intentá nuevamente.',
    );
  }
}

const mockRoutine = (objectiveId, adapted = false) => ({
  nombre: adapted ? 'Rutina adaptada por IA' : 'Rutina personal por IA',
  descripcion: 'Plan generado según tu perfil y objetivo. Ajustá las cargas a tu técnica.',
  objetivo_id: objectiveId,
  ejercicios: [
    {
      nombre_ejercicio: 'Sentadilla con peso corporal',
      grupo_muscular: 'Piernas',
      dia_semana: 'lunes',
      orden: 0,
      series: 3,
      repeticiones: 10,
      peso_sugerido_kg: 0,
      descanso_segundos: 90,
      observaciones: 'Detenete si sentís dolor.',
    },
  ],
});
const mockDiet = (objectiveId, adapted = false) => ({
  nombre: adapted ? 'Dieta adaptada por IA' : 'Dieta personal por IA',
  descripcion: 'Propuesta orientativa basada en tu perfil. No reemplaza atención profesional.',
  objetivo_id: objectiveId,
  calorias_objetivo: 2100,
  proteinas_objetivo_g: 140,
  carbohidratos_objetivo_g: 230,
  grasas_objetivo_g: 68,
  comidas: [
    {
      nombre_comida: 'Desayuno equilibrado',
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
          fuente: 'Estimación de referencia; verificar etiqueta',
        },
      ],
    },
  ],
});

async function context(userId, transaction) {
  const [user, measurements, goal, routines, diets, workouts] = await Promise.all([
    Users.findByPk(userId, { attributes: ['id', 'consentimiento_ia'], transaction }),
    Measurements.findAll({
      where: { usuario_id: userId },
      order: [['fecha_medicion', 'DESC']],
      limit: 10,
      transaction,
    }),
    Goals.findOne({ where: { usuario_id: userId, estado: 'activo' }, transaction }),
    Routines.findAll({
      where: { usuario_id: userId, estado: 'activa' },
      order: [['fecha_creacion', 'DESC']],
      limit: 5,
      transaction,
    }),
    Diets.findAll({
      where: { usuario_id: userId, estado: 'activa' },
      order: [['fecha_creacion', 'DESC']],
      limit: 5,
      transaction,
    }),
    Workouts.findAll({
      where: { usuario_id: userId },
      order: [['fecha_inicio', 'DESC']],
      limit: 10,
      transaction,
    }),
  ]);
  requireAiConsent(user);
  return dto({
    measurement: measurements[0] || null,
    measurements,
    goal,
    routines,
    diets,
    workouts,
  });
}

const requireAiConsent = (user) =>
  assert(
    user?.consentimiento_ia === true,
    403,
    'AI_CONSENT_REQUIRED',
    'Activá el consentimiento de IA desde tu perfil antes de compartir datos con el proveedor.',
  );

const ensureAiConsent = (userId) =>
  readFitness(userId, async (transaction) => {
    const user = await Users.findByPk(userId, {
      attributes: ['id', 'consentimiento_ia'],
      transaction,
    });
    requireAiConsent(user);
  });

export function validateAiRoutine(data) {
  const parsed = routineSchema.parse(data);
  assert(
    parsed.ejercicios.every(
      (exercise) =>
        exercise.series <= 10 &&
        exercise.repeticiones <= 50 &&
        exercise.peso_sugerido_kg <= 500 &&
        exercise.descanso_segundos >= 15,
    ),
    503,
    'AI_UNSAFE_RESPONSE',
    'La IA propuso una rutina fuera de los límites de seguridad. No se guardó ningún cambio.',
  );
  return parsed;
}

export function validateAiDiet(data) {
  const parsed = dietSchema.parse(data);
  const macroCalories =
    parsed.proteinas_objetivo_g * 4 +
    parsed.carbohidratos_objetivo_g * 4 +
    parsed.grasas_objetivo_g * 9;
  assert(
    parsed.calorias_objetivo >= 1200 &&
      parsed.calorias_objetivo <= 5000 &&
      Math.abs(macroCalories - parsed.calorias_objetivo) <= parsed.calorias_objetivo * 0.3,
    503,
    'AI_UNSAFE_RESPONSE',
    'La IA propuso una dieta nutricionalmente inconsistente. No se guardó ningún cambio.',
  );
  return parsed;
}

const requireProfileGoal = (value) => {
  assert(
    value.measurement && value.goal,
    409,
    'AI_CONTEXT_INCOMPLETE',
    'Completá tu perfil físico y definí un objetivo activo antes de usar la IA.',
  );
};
const systemPlan = (kind) => {
  const limits = kind.includes('dieta')
    ? 'Usá 1200 a 5000 kcal y hacé que 4 kcal por gramo de proteína y carbohidrato más 9 kcal por gramo de grasa coincidan con las calorías dentro de un 30%.'
    : 'Cada ejercicio debe tener 1 a 10 series, 1 a 50 repeticiones, 0 a 500 kg sugeridos y 15 a 600 segundos de descanso.';
  return `Sos el asistente de GYM-OS. Generá ${kind} segura, realista y no médica. ${limits} Respetá estrictamente el JSON solicitado y los nombres de campos. No diagnostiques ni prometas resultados.`;
};

async function generateStructuredPlan(messages, jsonSchema, zodSchema, objectiveId, validate) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const request =
        attempt === 0
          ? messages
          : [
              ...messages,
              {
                role: 'system',
                content:
                  'La respuesta anterior no superó las validaciones. Corregí todos los límites y devolvé únicamente un JSON válido.',
              },
            ];
      return validate(parseJson(await cohereChat(request, jsonSchema), zodSchema, objectiveId));
    } catch (error) {
      lastError = error;
      if (!['AI_INVALID_RESPONSE', 'AI_UNSAFE_RESPONSE'].includes(error.code)) throw error;
    }
  }
  throw lastError;
}

export const generateRoutine = (userId, input) =>
  new Rutina(
    {},
    {
      generarRutinaIA: () =>
        new Rutina(
          {},
          {
            generarConIA: () =>
              new IAService(
                {},
                {
                  generarRutina: async () => {
                    const ctx = await readFitness(userId, (transaction) =>
                      context(userId, transaction),
                    );
                    requireProfileGoal(ctx);
                    const data = env.ai.mock
                      ? mockRoutine(ctx.goal.id)
                      : await generateStructuredPlan(
                          [
                            { role: 'system', content: systemPlan('una rutina') },
                            {
                              role: 'user',
                              content: JSON.stringify({
                                contexto: ctx,
                                preferencias: input.preferencias,
                              }),
                            },
                          ],
                          routineJsonSchema,
                          routineSchema,
                          ctx.goal.id,
                          validateAiRoutine,
                        );
                    return saveAiRoutine(
                      userId,
                      validateAiRoutine(data),
                      null,
                      'CU015_GENERAR_RUTINA_IA',
                    );
                  },
                },
              ).generarRutina(),
          },
        ).generarConIA(),
    },
  ).generarRutinaIA();

export const adaptRoutine = (userId, id, input) =>
  new Rutina(
    {},
    {
      modificarRutinaIA: () =>
        new IAService(
          {},
          {
            generarRutina: async () => {
              const ctx = await readFitness(userId, async (transaction) => ({
                ...(await context(userId, transaction)),
                actual: await routineDetail(id, userId, transaction),
              }));
              requireProfileGoal(ctx);
              assert(
                ctx.workouts.length,
                409,
                'AI_CONTEXT_INCOMPLETE',
                'Registrá al menos un entrenamiento antes de adaptar la rutina con IA.',
              );
              const data = env.ai.mock
                ? mockRoutine(ctx.goal.id, true)
                : await generateStructuredPlan(
                    [
                      { role: 'system', content: systemPlan('una adaptación de rutina') },
                      {
                        role: 'user',
                        content: JSON.stringify({
                          contexto: ctx,
                          instrucciones: input.instrucciones,
                        }),
                      },
                    ],
                    routineJsonSchema,
                    routineSchema,
                    ctx.goal.id,
                    validateAiRoutine,
                  );
              return saveAiRoutine(userId, validateAiRoutine(data), id, 'CU019_ADAPTAR_RUTINA_IA');
            },
          },
        ).generarRutina(),
    },
  ).modificarRutinaIA();

export const generateDiet = (userId, input) =>
  new Dieta(
    {},
    {
      generarDietaIA: () =>
        new Dieta(
          {},
          {
            generarConIA: () =>
              new IAService(
                {},
                {
                  generarDieta: async () => {
                    const ctx = await readFitness(userId, (transaction) =>
                      context(userId, transaction),
                    );
                    requireProfileGoal(ctx);
                    const data = env.ai.mock
                      ? mockDiet(ctx.goal.id)
                      : await generateStructuredPlan(
                          [
                            { role: 'system', content: systemPlan('una dieta orientativa') },
                            {
                              role: 'user',
                              content: JSON.stringify({
                                contexto: ctx,
                                preferencias: input.preferencias,
                              }),
                            },
                          ],
                          dietJsonSchema,
                          dietSchema,
                          ctx.goal.id,
                          validateAiDiet,
                        );
                    return saveAiDiet(userId, validateAiDiet(data), null, 'CU023_GENERAR_DIETA_IA');
                  },
                },
              ).generarDieta(),
          },
        ).generarConIA(),
    },
  ).generarDietaIA();

export const adaptDiet = (userId, id, input) =>
  new Dieta(
    {},
    {
      modificarDietaIA: () =>
        new IAService(
          {},
          {
            generarDieta: async () => {
              const ctx = await readFitness(userId, async (transaction) => ({
                ...(await context(userId, transaction)),
                actual: await dietDetail(id, userId, transaction),
              }));
              requireProfileGoal(ctx);
              assert(
                ctx.workouts.length || ctx.measurements.length >= 2,
                409,
                'AI_CONTEXT_INCOMPLETE',
                'Registrá progreso físico o actividad antes de adaptar la dieta con IA.',
              );
              const data = env.ai.mock
                ? mockDiet(ctx.goal.id, true)
                : await generateStructuredPlan(
                    [
                      {
                        role: 'system',
                        content: systemPlan('una adaptación de dieta orientativa'),
                      },
                      {
                        role: 'user',
                        content: JSON.stringify({
                          contexto: ctx,
                          instrucciones: input.instrucciones,
                        }),
                      },
                    ],
                    dietJsonSchema,
                    dietSchema,
                    ctx.goal.id,
                    validateAiDiet,
                  );
              return saveAiDiet(userId, validateAiDiet(data), id, 'CU026_ADAPTAR_DIETA_IA');
            },
          },
        ).generarDieta(),
    },
  ).modificarDietaIA();

export const listConversations = (userId) =>
  readFitness(userId, async (transaction) => ({
    items: dto(
      await Conversations.findAll({
        where: { usuario_id: userId },
        order: [['fecha_creacion', 'DESC']],
        transaction,
      }),
    ),
  }));

export const getConversation = (userId, id) =>
  readFitness(userId, async (transaction) => {
    const conversation = await Conversations.findOne({
      where: { id, usuario_id: userId },
      transaction,
    });
    assert(conversation, 404, 'NOT_FOUND', 'No se encontró la conversación.');
    const messages = await Messages.findAll({
      where: { conversacion_id: id },
      order: [['fecha_creacion', 'ASC']],
      transaction,
    });
    return { ...dto(conversation), mensajes: dto(messages) };
  });

export const chat = (userId, input) =>
  new IAService(
    {},
    {
      responderconsulta: () =>
        new IAService(
          {},
          {
            responderConsulta: async () => {
              await ensureAiConsent(userId);
              let previous = [];
              if (input.conversacion_id) {
                const conversation = await getConversation(userId, input.conversacion_id);
                assert(
                  conversation.modo === input.modo,
                  400,
                  'CONVERSATION_MODE',
                  'El modo no coincide con la conversación.',
                );
                previous = conversation.mensajes
                  .slice(-10)
                  .map((m) => ({ role: m.rol, content: m.contenido }));
              }
              let answer;
              try {
                answer = env.ai.mock
                  ? {
                      relacionado: !/bitcoin|criptomoneda|pol[ií]tica/i.test(input.consulta),
                      respuesta:
                        'Puedo ayudarte con entrenamiento, nutrición orientativa y el uso de GYM-OS.',
                    }
                  : JSON.parse(
                      await cohereChat(
                        [
                          {
                            role: 'system',
                            content: `Respondé en español como ${input.modo === 'soporte' ? 'soporte de GYM-OS' : 'entrenador físico general'}. Indicá relacionado=false si la consulta no trata sobre GYM-OS, ejercicio, hábitos o nutrición general. No des diagnósticos médicos.`,
                          },
                          ...previous,
                          { role: 'user', content: input.consulta },
                        ],
                        chatJsonSchema,
                      ),
                    );
              } catch (error) {
                if (error instanceof AppError) throw error;
                throw new AppError(
                  503,
                  'AI_INVALID_RESPONSE',
                  'El asistente devolvió una respuesta inválida. Intentá nuevamente.',
                );
              }
              assert(
                typeof answer.respuesta === 'string' && answer.respuesta.trim(),
                503,
                'AI_INVALID_RESPONSE',
                'El asistente devolvió una respuesta inválida.',
              );
              const responseText =
                answer.relacionado === true
                  ? answer.respuesta.trim()
                  : 'Solo puedo ayudarte con GYM—OS, entrenamiento, hábitos y nutrición general.';
              return writeFitness(userId, 'CU031_ASISTENTE_IA', 'ia', async (transaction) => {
                const messageTime = Date.now();
                let conversation;
                if (input.conversacion_id) {
                  conversation = await Conversations.findOne({
                    where: { id: input.conversacion_id, usuario_id: userId },
                    transaction,
                  });
                  assert(conversation, 404, 'NOT_FOUND', 'No se encontró la conversación.');
                } else {
                  conversation = await Conversations.create(
                    {
                      usuario_id: userId,
                      modo: input.modo,
                      titulo: input.consulta.slice(0, 100),
                      fecha_creacion: new Date(),
                    },
                    { transaction },
                  );
                }
                await Messages.bulkCreate(
                  [
                    {
                      conversacion_id: conversation.id,
                      rol: 'user',
                      contenido: input.consulta,
                      fecha_creacion: new Date(messageTime),
                    },
                    {
                      conversacion_id: conversation.id,
                      rol: 'assistant',
                      contenido: responseText,
                      fecha_creacion: new Date(messageTime + 1),
                    },
                  ],
                  { transaction },
                );
                const mensajes = await Messages.findAll({
                  where: { conversacion_id: conversation.id },
                  order: [['fecha_creacion', 'ASC']],
                  transaction,
                });
                return { ...dto(conversation), mensajes: dto(mensajes) };
              });
            },
          },
        ).responderConsulta(),
    },
  ).responderconsulta();

let healthCache;
export async function aiStatus() {
  if (env.ai.mock)
    return {
      proveedor: env.ai.provider,
      modelo: env.ai.model,
      configurado: true,
      disponible: true,
      modo_prueba: true,
      verificado_en: new Date().toISOString(),
    };
  if (!env.ai.apiKey)
    return {
      proveedor: env.ai.provider,
      modelo: env.ai.model,
      configurado: false,
      disponible: false,
      modo_prueba: false,
      verificado_en: null,
    };
  if (healthCache && Date.now() - healthCache.at < 5 * 60000) return healthCache.value;
  let disponible = false;
  try {
    const value = JSON.parse(
      await cohereChat(
        [
          { role: 'system', content: 'Respondé únicamente el JSON solicitado.' },
          { role: 'user', content: 'Confirmá disponibilidad.' },
        ],
        {
          type: 'object',
          required: ['ok'],
          properties: { ok: { type: 'boolean' } },
        },
      ),
    );
    disponible = value.ok === true;
  } catch {
    disponible = false;
  }
  const value = {
    proveedor: env.ai.provider,
    modelo: env.ai.model,
    configurado: true,
    disponible,
    modo_prueba: false,
    verificado_en: new Date().toISOString(),
  };
  healthCache = { at: Date.now(), value };
  return value;
}
