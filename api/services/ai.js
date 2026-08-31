import { routineSchema, dietSchema } from '@gym-os/shared/schemas';
import { env } from '../config/env.js';
import { Dieta, IAService, Rutina } from '../domain/uml.js';
import { dto, readFitness, writeFitness } from '../lib/domain.js';
import { AppError, assert } from '../lib/errors.js';
import { models } from '../models/index.js';
import { cohereChat } from './cohere.js';
import { routineDetail, saveAiRoutine } from './routines.js';
import { dietDetail, saveAiDiet } from './nutrition.js';

const {
  mediciones_fisicas: Measurements,
  objetivos: Goals,
  rutinas: Routines,
  dietas: Diets,
  entrenamientos: Workouts,
  conversaciones: Conversations,
  mensajes: Messages,
} = models;

const routineJsonSchema = {
  type: 'object',
  required: ['nombre', 'descripcion', 'ejercicios'],
  properties: {
    nombre: { type: 'string' },
    descripcion: { type: 'string' },
    ejercicios: {
      type: 'array',
      minItems: 1,
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
const dietJsonSchema = {
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
      minItems: 1,
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
            minItems: 1,
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
const chatJsonSchema = {
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
  const [measurements, goal, routines, diets, workouts] = await Promise.all([
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
  return dto({
    measurement: measurements[0] || null,
    measurements,
    goal,
    routines,
    diets,
    workouts,
  });
}

const requireProfileGoal = (value) => {
  assert(
    value.measurement && value.goal,
    409,
    'AI_CONTEXT_INCOMPLETE',
    'Completá tu perfil físico y definí un objetivo activo antes de usar la IA.',
  );
};
const systemPlan = (kind) =>
  `Sos el asistente de GYM-OS. Generá ${kind} segura, realista y no médica. Respetá estrictamente el JSON solicitado, los límites y los nombres de campos. No diagnostiques ni prometas resultados.`;

export const generateRoutine = (userId, input) =>
  new Rutina(
    {},
    {
      generarConIA: () =>
        new IAService(
          {},
          {
            generarRutina: async () => {
              const ctx = await readFitness(userId, (transaction) => context(userId, transaction));
              requireProfileGoal(ctx);
              const data = env.ai.mock
                ? mockRoutine(ctx.goal.id)
                : parseJson(
                    await cohereChat(
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
                    ),
                    routineSchema,
                    ctx.goal.id,
                  );
              return saveAiRoutine(
                userId,
                routineSchema.parse(data),
                null,
                'CU015_GENERAR_RUTINA_IA',
              );
            },
          },
        ).generarRutina(),
    },
  ).generarConIA();

export const adaptRoutine = (userId, id, input) =>
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
          : parseJson(
              await cohereChat(
                [
                  { role: 'system', content: systemPlan('una adaptación de rutina') },
                  {
                    role: 'user',
                    content: JSON.stringify({ contexto: ctx, instrucciones: input.instrucciones }),
                  },
                ],
                routineJsonSchema,
              ),
              routineSchema,
              ctx.goal.id,
            );
        return saveAiRoutine(userId, routineSchema.parse(data), id, 'CU019_ADAPTAR_RUTINA_IA');
      },
    },
  ).generarRutina();

export const generateDiet = (userId, input) =>
  new Dieta(
    {},
    {
      generarConIA: () =>
        new IAService(
          {},
          {
            generarDieta: async () => {
              const ctx = await readFitness(userId, (transaction) => context(userId, transaction));
              requireProfileGoal(ctx);
              const data = env.ai.mock
                ? mockDiet(ctx.goal.id)
                : parseJson(
                    await cohereChat(
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
                    ),
                    dietSchema,
                    ctx.goal.id,
                  );
              return saveAiDiet(userId, dietSchema.parse(data), null, 'CU023_GENERAR_DIETA_IA');
            },
          },
        ).generarDieta(),
    },
  ).generarConIA();

export const adaptDiet = (userId, id, input) =>
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
          : parseJson(
              await cohereChat(
                [
                  { role: 'system', content: systemPlan('una adaptación de dieta orientativa') },
                  {
                    role: 'user',
                    content: JSON.stringify({ contexto: ctx, instrucciones: input.instrucciones }),
                  },
                ],
                dietJsonSchema,
              ),
              dietSchema,
              ctx.goal.id,
            );
        return saveAiDiet(userId, dietSchema.parse(data), id, 'CU026_ADAPTAR_DIETA_IA');
      },
    },
  ).generarDieta();

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
      responderConsulta: async () => {
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
          answer?.relacionado === true,
          400,
          'AI_OUT_OF_SCOPE',
          'El asistente solo responde sobre GYM-OS, entrenamiento, hábitos y nutrición general.',
        );
        assert(
          typeof answer.respuesta === 'string' && answer.respuesta.trim(),
          503,
          'AI_INVALID_RESPONSE',
          'El asistente devolvió una respuesta inválida.',
        );
        return writeFitness(userId, 'CU031_ASISTENTE_IA', 'ia', async (transaction) => {
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
                fecha_creacion: new Date(),
              },
              {
                conversacion_id: conversation.id,
                rol: 'assistant',
                contenido: answer.respuesta.trim(),
                fecha_creacion: new Date(),
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
  ).responderConsulta();

export const aiStatus = () => ({
  proveedor: env.ai.provider,
  modelo: env.ai.model,
  configurado: env.ai.mock || Boolean(env.ai.apiKey),
  modo_prueba: env.ai.mock,
});
