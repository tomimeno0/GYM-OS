import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { ZodError } from 'zod';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { env, rootDir } from './config/env.js';
import { sequelize } from './config/database.js';
import { AppError } from './lib/errors.js';
import { accountRouter } from './routes/accounts.js';
import { adminRouter } from './routes/admin.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:'], 'style-src': ["'self'", "'unsafe-inline'"], 'connect-src': ["'self'"] } } }));
app.use(cors({ origin: env.origin, credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (req.get('X-GymOS-Client') !== 'web' || (req.get('Origin') && req.get('Origin') !== env.origin)) return next(new AppError(403, 'CSRF_REJECTED', 'Origen de solicitud no autorizado.'));
  }
  next();
});
app.get('/api/health', async (req, res) => { await sequelize.authenticate(); res.json({ status: 'ok', database: 'mysql' }); });
app.use('/api/v1', accountRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api', (req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' } }));
const dist = path.join(rootDir, 'client/dist');
if (existsSync(dist)) { app.use(express.static(dist)); app.get('/{*path}', (req, res) => res.sendFile(path.join(dist, 'index.html'))); }
app.use((err, req, res, next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Revisá los datos ingresados.', details: err.issues.map(i => ({ field: i.path.join('.'), message: i.message })) } });
  if (err instanceof AppError) return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } });
  if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: { code: 'CONFLICT', message: 'Ya existe un registro con esos datos.' } });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El cuerpo JSON no es válido.' } });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'La solicitud supera el tamaño permitido.' } });
  console.error(`[api] ${err.name || 'Error'} en ${req.method} ${req.path}`);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'No se pudo completar la operación. Intentá nuevamente.' } });
});
