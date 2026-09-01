import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { assert } from './errors.controller.js';
const raw = readFileSync(new URL('../models/exercises/exercises.json', import.meta.url));
export const provenance = JSON.parse(
  readFileSync(new URL('../models/exercises/provenance.json', import.meta.url), 'utf8'),
);
assert(
  createHash('sha256').update(raw).digest('hex') === provenance.fileSha256,
  503,
  'CATALOG_INTEGRITY',
  'El archivo de ejercicios fue alterado.',
);
export const exercises = Object.freeze(JSON.parse(raw));
const byId = new Map(exercises.map((e) => [e.id, e]));
assert(
  exercises.length === provenance.count && byId.size === exercises.length,
  503,
  'CATALOG_INVALID',
  'El catálogo de ejercicios está incompleto.',
);
const norm = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
export const categories = {
  waist: 'Abdominales',
  back: 'Espalda',
  chest: 'Pecho',
  shoulders: 'Hombros',
  'upper arms': 'Brazos',
  'lower arms': 'Antebrazos',
  'upper legs': 'Piernas',
  'lower legs': 'Pantorrillas',
  neck: 'Cuello',
  cardio: 'Cardio',
};
export const equipmentLabels = {
  'body weight': 'Peso corporal',
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  cable: 'Polea',
  band: 'Banda elástica',
  'leverage machine': 'Máquina',
  'smith machine': 'Máquina Smith',
  kettlebell: 'Pesa rusa',
  'stability ball': 'Pelota',
  weighted: 'Con lastre',
};
export function getExercise(id) {
  const item = byId.get(id);
  assert(item, 404, 'EXERCISE_NOT_FOUND', 'El ejercicio no existe en el catálogo.');
  return item;
}
export function searchExercises({ q = '', category, equipment, page = 1, limit = 24 }) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const rows = exercises.filter(
    (e) =>
      (!category || e.category === category) &&
      (!equipment || e.equipment === equipment) &&
      terms.every((term) =>
        norm(
          [
            e.name,
            e.category,
            categories[e.category],
            e.equipment,
            equipmentLabels[e.equipment],
            e.target,
            e.instructions.es,
          ].join(' '),
        ).includes(term),
      ),
  );
  return {
    total: rows.length,
    page,
    pages: Math.ceil(rows.length / limit),
    items: rows.slice((page - 1) * limit, page * limit),
    filters: {
      categories: [...new Set(exercises.map((e) => e.category))]
        .sort()
        .map((value) => ({ value, label: categories[value] || value })),
      equipment: [...new Set(exercises.map((e) => e.equipment))]
        .sort()
        .map((value) => ({ value, label: equipmentLabels[value] || value })),
    },
    source: provenance.repository,
  };
}
