import { z } from 'zod';
import { GOAL_TYPES, DAYS, MEAL_TYPES, PERMISSIONS } from './constants.js';

export const uuid = z.string().uuid();
const text = (max = 2000) => z.string().trim().max(max);
const name = z.string().trim().min(2, 'Ingresá al menos 2 caracteres.').max(100);
const number = (min, max) => z.number().finite().min(min).max(max);
const optionalNumber = (min, max) => number(min, max).nullable().optional();
const day = z.iso.date();
export const password = z.string().min(10, 'Usá al menos 10 caracteres.').max(128);
export const email = z
  .email('Ingresá un correo válido.')
  .max(150)
  .transform((v) => v.toLowerCase().trim());
export const registerSchema = z
  .object({ nombre: name, apellido: text(100).default(''), email, password })
  .strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const profileSchema = z
  .object({
    nombre: name.optional(),
    apellido: text(100).optional(),
    telefono: z
      .string()
      .trim()
      .regex(/^[+\d()\s-]{0,30}$/, 'Teléfono inválido.')
      .optional(),
    fecha_nacimiento: day
      .refine((v) => v <= new Date().toISOString().slice(0, 10), 'La fecha no puede ser futura.')
      .nullable()
      .optional(),
    genero: z.enum(['masculino', 'femenino', 'otro']).optional(),
    zona_horaria: z
      .string()
      .refine((v) => {
        try {
          new Intl.DateTimeFormat('es', { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }, 'Zona horaria inválida.')
      .optional(),
  })
  .strict();
export const measurementSchema = z
  .object({
    peso_kg: number(20, 400),
    altura_cm: number(80, 250),
    grasa_corporal: optionalNumber(0, 75),
    musculo_corporal: optionalNumber(0, 90),
    nivel_actividad: z.enum(['baja', 'media', 'alta']),
    cintura_cm: optionalNumber(20, 250),
    pecho_cm: optionalNumber(20, 250),
    brazos_cm: optionalNumber(5, 100),
    piernas_cm: optionalNumber(10, 150),
    fecha_medicion: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.grasa_corporal == null ||
      v.musculo_corporal == null ||
      v.grasa_corporal + v.musculo_corporal <= 100,
    'Los porcentajes no pueden superar 100%.',
  );
export const goalSchema = z
  .object({
    nombre: name,
    descripcion: text().default(''),
    tipo: z.enum(GOAL_TYPES),
    valor_objetivo: number(0.1, 10000),
    unidad: z.enum(['kg', 'km', 'veces_por_semana', 'porcentaje']),
    frecuencia_semanal: z.number().int().min(1).max(7).default(3),
    actividad_objetivo: z.enum(['baja', 'media', 'alta']).default('media'),
    fecha_inicio: day,
    fecha_fin_estimada: day.nullable().optional(),
  })
  .strict()
  .refine(
    (v) => !v.fecha_fin_estimada || v.fecha_fin_estimada >= v.fecha_inicio,
    'La fecha final debe ser posterior al inicio.',
  );
export const exerciseSchema = z
  .object({
    ejercicio_id: z.string().max(40).nullable().optional(),
    nombre_ejercicio: z.string().trim().min(2).max(150),
    grupo_muscular: text(100).default(''),
    dia_semana: z.enum(DAYS),
    orden: z.number().int().min(0).max(100),
    series: z.number().int().min(1).max(20),
    repeticiones: z.number().int().min(1).max(200),
    peso_sugerido_kg: number(0, 1000).default(0),
    descanso_segundos: z.number().int().min(0).max(1800).default(90),
    observaciones: text().default(''),
  })
  .strict();
export const routineSchema = z
  .object({
    nombre: name,
    descripcion: text().default(''),
    objetivo_id: uuid.nullable().optional(),
    ejercicios: z.array(exerciseSchema).min(1).max(100),
  })
  .strict();
export const foodSchema = z
  .object({
    nombre: z.string().trim().min(2).max(150),
    cantidad: number(0.1, 10000),
    unidad: z.enum(['g', 'ml', 'porcion']),
    calorias: number(0, 10000),
    proteinas_g: number(0, 1000),
    carbohidratos_g: number(0, 1000),
    grasas_g: number(0, 1000),
    fuente: text(300).default('Registro manual'),
  })
  .strict();
export const mealSchema = z
  .object({
    nombre_comida: z.string().trim().min(2).max(150),
    tipo_comida: z.enum(MEAL_TYPES),
    hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    alimentos: z.array(foodSchema).min(1).max(30),
    observaciones: text().default(''),
  })
  .strict();
export const dietSchema = z
  .object({
    nombre: name,
    descripcion: text().default(''),
    objetivo_id: uuid.nullable().optional(),
    calorias_objetivo: number(0, 10000),
    proteinas_objetivo_g: number(0, 1000),
    carbohidratos_objetivo_g: number(0, 1500),
    grasas_objetivo_g: number(0, 1000),
    comidas: z.array(mealSchema).min(1).max(15),
  })
  .strict();
export const aiGenerateSchema = z
  .object({
    preferencias: text(1000).default(''),
  })
  .strict();
export const aiAdaptSchema = z
  .object({
    instrucciones: z.string().trim().min(2).max(1000),
  })
  .strict();
export const aiChatSchema = z
  .object({
    conversacion_id: uuid.optional(),
    modo: z.enum(['entrenador', 'soporte']).default('entrenador'),
    consulta: z.string().trim().min(1).max(2000),
  })
  .strict();
export const consumedSchema = z
  .object({
    nombre_comida: z.string().trim().min(2).max(150),
    tipo_comida: z.enum(MEAL_TYPES),
    fecha_consumo: z.iso.datetime({ offset: true }),
    alimentos: z.array(foodSchema).min(1).max(30),
  })
  .strict();
export const roleSchema = z
  .object({
    nombre: z.string().trim().min(2).max(50),
    descripcion: text(255).default(''),
    permisos: z
      .array(z.enum(PERMISSIONS))
      .min(1)
      .refine((v) => new Set(v).size === v.length, 'Permisos repetidos.'),
  })
  .strict();

export const startWorkoutSchema = z.object({ rutina_id: uuid, dia_semana: z.enum(DAYS) }).strict();
export const workoutSchema = z
  .object({
    estado: z.enum(['iniciado', 'completado', 'incompleto', 'cancelado']),
    observaciones: text().default(''),
    distancia_km: number(0, 500).default(0),
    ejercicios: z
      .array(
        z
          .object({
            id: uuid,
            series: z.number().int().min(0).max(20),
            repeticiones: z.number().int().min(0).max(200),
            peso_utilizado_kg: number(0, 1000),
            realizado: z.boolean(),
            observaciones: text().default(''),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
