import { authenticate } from '../services/accounts.js';
import { assert } from '../lib/errors.js';
export async function requireAuth(req, res, next) {
  req.user = await authenticate(req.cookies.gymos_session);
  next();
}
export const permit = (permission) => (req, res, next) => {
  assert(
    req.user?.permisos.includes(permission),
    403,
    'FORBIDDEN',
    'No tenés permiso para acceder a esta sección.',
  );
  next();
};
