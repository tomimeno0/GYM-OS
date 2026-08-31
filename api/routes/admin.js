import { Router } from 'express';
import { z } from 'zod';
import { roleSchema, uuid } from '@gym-os/shared/schemas';
import { requireAuth, permit } from '../middleware/auth.js';
import * as admin from '../services/admin.js';
export const adminRouter = Router();
adminRouter.use(requireAuth);
const pagination = { page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) };
const confirmation = z.object({ confirmar: z.literal(true) }).strict();
adminRouter.get('/users', permit('users:read'), async (req, res) => res.json(await admin.listUsers(req.user.id, z.object({ ...pagination, q: z.string().max(100).optional(), estado: z.enum(['activo', 'bloqueado']).optional() }).parse(req.query))));
adminRouter.get('/roles', permit('roles:manage'), async (req, res) => res.json({ items: await admin.listRoles(req.user.id) }));
adminRouter.post('/roles', permit('roles:manage'), async (req, res) => res.status(201).json(await admin.saveRole(req.user.id, null, roleSchema.parse(req.body))));
adminRouter.put('/roles/:id', permit('roles:manage'), async (req, res) => res.json(await admin.saveRole(req.user.id, uuid.parse(req.params.id), roleSchema.parse(req.body))));
adminRouter.delete('/roles/:id', permit('roles:manage'), async (req, res) => { confirmation.parse(req.body); await admin.deleteRole(req.user.id, uuid.parse(req.params.id)); res.status(204).end(); });
adminRouter.put('/users/:id/roles', permit('roles:manage'), async (req, res) => {
  const body = z.object({ roles: z.array(uuid).min(1).max(20).refine(v => new Set(v).size === v.length), confirmar: z.literal(true) }).strict().parse(req.body);
  res.json(await admin.assignRoles(req.user.id, uuid.parse(req.params.id), body.roles));
});
adminRouter.patch('/users/:id/status', permit('users:manage'), async (req, res) => {
  const body = z.object({ estado: z.enum(['activo', 'bloqueado']), confirmar: z.literal(true) }).strict().parse(req.body);
  res.json(await admin.changeStatus(req.user.id, uuid.parse(req.params.id), body.estado));
});
adminRouter.delete('/users/:id', permit('users:manage'), async (req, res) => { confirmation.parse(req.body); await admin.removeUser(req.user.id, uuid.parse(req.params.id)); res.status(204).end(); });
adminRouter.get('/audit', permit('audit:read'), async (req, res) => res.json(await admin.listAudit(req.user.id, z.object({ ...pagination, modulo: z.string().max(100).optional(), resultado: z.enum(['exitoso', 'fallido', 'advertencia']).optional() }).parse(req.query))));
adminRouter.get('/integrity', permit('integrity:read'), async (req, res) => res.json(await admin.integrityReport(req.user.id)));
