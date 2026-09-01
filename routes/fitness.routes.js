import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import {
  measurementSchema,
  goalSchema,
  routineSchema,
  dietSchema,
  consumedSchema,
  startWorkoutSchema,
  workoutSchema,
  paginationSchema,
  aiGenerateSchema,
  aiAdaptSchema,
  aiChatSchema,
  uuid,
} from '@gym-os/shared/schemas';
import { requireAuth, permit } from '../controllers/auth.controller.js';
import * as fitness from '../controllers/fitness.controller.js';
import * as routines from '../controllers/routines.controller.js';
import * as workouts from '../controllers/workouts.controller.js';
import * as nutrition from '../controllers/nutrition.controller.js';
import * as ai from '../controllers/ai.controller.js';
import { searchExercises, getExercise } from '../controllers/catalog.controller.js';
import { searchFoods } from '../controllers/foods.controller.js';
import { readFitness, dto } from '../controllers/domain.controller.js';
import { models } from '../models/index.js';

export const fitnessRouter = Router();
fitnessRouter.use(requireAuth, permit('fitness:use'));
const confirm = z.object({ confirmar: z.literal(true) }).strict();
const id = (req) => uuid.parse(req.params.id);
fitnessRouter.get('/measurements', async (req, res) =>
  res.json(await fitness.listMeasurements(req.user.id, paginationSchema.parse(req.query))),
);
fitnessRouter.post('/measurements/initial', async (req, res) =>
  res
    .status(201)
    .json(await fitness.addMeasurement(req.user.id, measurementSchema.parse(req.body), true)),
);
fitnessRouter.post('/measurements', async (req, res) =>
  res
    .status(201)
    .json(await fitness.addMeasurement(req.user.id, measurementSchema.parse(req.body), false)),
);
fitnessRouter.get('/goals', async (req, res) => res.json(await fitness.listGoals(req.user.id)));
fitnessRouter.post('/goals', async (req, res) =>
  res.status(201).json(await fitness.createGoal(req.user.id, goalSchema.parse(req.body))),
);
fitnessRouter.post('/goals/:id/complete', async (req, res) => {
  confirm.parse(req.body);
  res.json(await fitness.completeGoal(req.user.id, id(req)));
});
fitnessRouter.delete('/goals/:id', async (req, res) => {
  confirm.parse(req.body);
  await fitness.removeGoal(req.user.id, id(req));
  res.status(204).end();
});
fitnessRouter.get('/progress', async (req, res) =>
  res.json(
    await fitness.getProgress(
      req.user.id,
      z.coerce.number().int().min(7).max(730).default(90).parse(req.query.days),
    ),
  ),
);
fitnessRouter.get('/routines', async (req, res) =>
  res.json(await routines.listRoutines(req.user.id)),
);
fitnessRouter.get('/routines/:id', async (req, res) =>
  res.json(await routines.getRoutine(req.user.id, id(req))),
);
fitnessRouter.post('/routines', async (req, res) =>
  res.status(201).json(await routines.saveRoutine(req.user.id, routineSchema.parse(req.body))),
);
fitnessRouter.put('/routines/:id', async (req, res) =>
  res.json(await routines.saveRoutine(req.user.id, routineSchema.parse(req.body), id(req))),
);
fitnessRouter.delete('/routines/:id', async (req, res) => {
  confirm.parse(req.body);
  await routines.removeRoutine(req.user.id, id(req));
  res.status(204).end();
});
fitnessRouter.get('/workouts', async (req, res) =>
  res.json(await workouts.listWorkouts(req.user.id, paginationSchema.parse(req.query))),
);
fitnessRouter.get('/workouts/:id', async (req, res) =>
  res.json(await workouts.getWorkout(req.user.id, id(req))),
);
fitnessRouter.post('/workouts', async (req, res) =>
  res
    .status(201)
    .json(await workouts.startWorkout(req.user.id, startWorkoutSchema.parse(req.body))),
);
fitnessRouter.put('/workouts/:id', async (req, res) =>
  res.json(await workouts.saveWorkout(req.user.id, id(req), workoutSchema.parse(req.body))),
);
fitnessRouter.get('/diets', async (req, res) => res.json(await nutrition.listDiets(req.user.id)));
fitnessRouter.get('/diets/:id', async (req, res) =>
  res.json(await nutrition.getDiet(req.user.id, id(req))),
);
fitnessRouter.post('/diets', async (req, res) =>
  res.status(201).json(await nutrition.saveDiet(req.user.id, dietSchema.parse(req.body))),
);
fitnessRouter.put('/diets/:id', async (req, res) =>
  res.json(await nutrition.saveDiet(req.user.id, dietSchema.parse(req.body), id(req))),
);
fitnessRouter.delete('/diets/:id', async (req, res) => {
  confirm.parse(req.body);
  await nutrition.removeDiet(req.user.id, id(req));
  res.status(204).end();
});
fitnessRouter.get('/nutrition', async (req, res) => {
  const q = z.object({ date: z.iso.date().optional(), diet: uuid.optional() }).parse(req.query);
  res.json(await nutrition.getNutrition(req.user.id, q.date, q.diet));
});
fitnessRouter.post('/consumed', async (req, res) =>
  res.status(201).json(await nutrition.saveConsumed(req.user.id, consumedSchema.parse(req.body))),
);
fitnessRouter.put('/consumed/:id', async (req, res) =>
  res.json(await nutrition.saveConsumed(req.user.id, consumedSchema.parse(req.body), id(req))),
);
fitnessRouter.delete('/consumed/:id', async (req, res) => {
  confirm.parse(req.body);
  await nutrition.removeConsumed(req.user.id, id(req));
  res.status(204).end();
});
fitnessRouter.get('/exercises', (req, res) =>
  res.json(
    searchExercises(
      paginationSchema
        .extend({
          q: z.string().max(100).default(''),
          category: z.string().max(100).optional(),
          equipment: z.string().max(100).optional(),
        })
        .parse(req.query),
    ),
  ),
);
fitnessRouter.get('/exercises/:id', (req, res) =>
  res.json(
    getExercise(
      z
        .string()
        .regex(/^\d{4,10}$/)
        .parse(req.params.id),
    ),
  ),
);
const foodLimiter = rateLimit({
  windowMs: 60000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Esperá un minuto antes de volver a buscar alimentos.' },
  },
});
const aiLimiter = rateLimit({
  windowMs: 60000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMIT', message: 'Esperá un minuto antes de volver a usar la IA.' },
  },
});
fitnessRouter.get('/ai/status', async (req, res) => res.json(await ai.aiStatus()));
fitnessRouter.post('/ai/routines/generate', aiLimiter, async (req, res) =>
  res.status(201).json(await ai.generateRoutine(req.user.id, aiGenerateSchema.parse(req.body))),
);
fitnessRouter.post('/ai/routines/:id/adapt', aiLimiter, async (req, res) =>
  res.json(await ai.adaptRoutine(req.user.id, id(req), aiAdaptSchema.parse(req.body))),
);
fitnessRouter.post('/ai/diets/generate', aiLimiter, async (req, res) =>
  res.status(201).json(await ai.generateDiet(req.user.id, aiGenerateSchema.parse(req.body))),
);
fitnessRouter.post('/ai/diets/:id/adapt', aiLimiter, async (req, res) =>
  res.json(await ai.adaptDiet(req.user.id, id(req), aiAdaptSchema.parse(req.body))),
);
fitnessRouter.get('/ai/conversations', async (req, res) =>
  res.json(await ai.listConversations(req.user.id)),
);
fitnessRouter.get('/ai/conversations/:id', async (req, res) =>
  res.json(await ai.getConversation(req.user.id, id(req))),
);
fitnessRouter.post('/ai/chat', aiLimiter, async (req, res) =>
  res.json(await ai.chat(req.user.id, aiChatSchema.parse(req.body))),
);
fitnessRouter.get('/foods', foodLimiter, async (req, res) => {
  const q = z
    .object({
      q: z.string().trim().min(2).max(100).optional(),
      barcode: z
        .string()
        .regex(/^\d{8,14}$/)
        .optional(),
    })
    .refine((v) => Boolean(v.q) !== Boolean(v.barcode), 'Ingresá nombre o código de barras.')
    .parse(req.query);
  res.json(await searchFoods(q.q, q.barcode));
});
fitnessRouter.get('/dashboard', async (req, res) =>
  res.json(
    await readFitness(req.user.id, async (transaction, user) => {
      const progress = await fitness.progressData(user.id, user, transaction, 30);
      const nutritionToday = await nutrition.nutritionData(user.id, user, transaction);
      const routinesList = await models.rutinas.findAll({
        where: { usuario_id: user.id, estado: 'activa' },
        order: [['fecha_creacion', 'DESC']],
        limit: 3,
        transaction,
      });
      const active = await models.entrenamientos.findOne({
        where: { usuario_id: user.id, estado: 'iniciado' },
        transaction,
      });
      return {
        progreso: progress,
        nutricion: nutritionToday,
        rutinas: dto(routinesList),
        entrenamiento_activo: active
          ? await workouts.workoutDetail(active.id, user.id, transaction)
          : null,
      };
    }),
  ),
);
