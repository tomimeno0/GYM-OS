import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import {
  registerSchema,
  loginSchema,
  profileSchema,
  password,
  email,
} from '@gym-os/shared/schemas';
import { requireAuth } from '../middleware/auth.js';
import * as accounts from '../services/accounts.js';
import { env } from '../config/env.js';

export const accountRouter = Router();
const limiter = rateLimit({
  windowMs: 15 * 60000,
  limit: env.nodeEnv === 'test' ? 1000 : 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Demasiados intentos. Probá en 15 minutos.' } },
});
const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 86400000,
};
function signedIn(res, result, status = 200) {
  res
    .cookie('gymos_session', result.token, cookieOptions)
    .status(status)
    .json({ user: result.user });
}
accountRouter.post('/auth/register', limiter, async (req, res) =>
  signedIn(res, await accounts.register(registerSchema.parse(req.body)), 201),
);
accountRouter.post('/auth/login', limiter, async (req, res) =>
  signedIn(res, await accounts.login(loginSchema.parse(req.body))),
);
accountRouter.post('/auth/forgot-password', limiter, async (req, res) =>
  res.json(await accounts.requestRecovery(z.object({ email }).strict().parse(req.body).email)),
);
accountRouter.post('/auth/reset-password', limiter, async (req, res) => {
  const data = z
    .object({ token: z.string().min(20).max(100), password })
    .strict()
    .parse(req.body);
  res.json(await accounts.resetPassword(data.token, data.password));
});
accountRouter.post('/auth/logout', requireAuth, async (req, res) => {
  z.object({ confirmar: z.literal(true) })
    .strict()
    .parse(req.body);
  await accounts.logout(req.user.id, req.cookies.gymos_session);
  res
    .clearCookie('gymos_session', { ...cookieOptions, maxAge: undefined })
    .status(204)
    .end();
});
accountRouter.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
accountRouter.patch('/me', requireAuth, async (req, res) =>
  res.json({ user: await accounts.updateProfile(req.user.id, profileSchema.parse(req.body)) }),
);
accountRouter.delete('/me', requireAuth, async (req, res) => {
  const data = z
    .object({ confirmar: z.literal(true), password: z.string().min(1).max(128) })
    .strict()
    .parse(req.body);
  await accounts.deleteAccount(req.user.id, data.password);
  res
    .clearCookie('gymos_session', { ...cookieOptions, maxAge: undefined })
    .status(204)
    .end();
});
