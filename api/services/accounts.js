import { Op } from 'sequelize';
import { models } from '../models/index.js';
import { atomic, verified, audit } from './integrity.js';
import { hashPassword, verifyPassword, encrypt, decrypt, newToken, hashToken } from './security.js';
import { sendRecovery } from './mail.js';
import { assert } from '../lib/errors.js';
import { Cliente, Usuario } from '../domain/uml.js';

const {
  usuarios: Users,
  roles: Roles,
  usuario_roles: UserRoles,
  sesiones: Sessions,
  recuperaciones: Resets,
} = models;
const roleInclude = [{ model: Roles, as: 'roles', through: { attributes: [] } }];
export const loadUser = (id, transaction) =>
  Users.findByPk(id, { include: roleInclude, transaction });
export function publicUser(user) {
  const u = user.get ? user.get({ plain: true }) : user;
  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    estado: u.estado,
    telefono: decrypt(u.telefono_cifrado),
    fecha_nacimiento: u.fecha_nacimiento,
    genero: u.genero,
    zona_horaria: u.zona_horaria,
    fecha_registro: u.fecha_registro,
    consentimiento_ia: Boolean(u.consentimiento_ia),
    roles: (u.roles || []).map((r) => ({ id: r.id, nombre: r.nombre, sistema: r.sistema })),
    permisos: [...new Set((u.roles || []).flatMap((r) => r.permisos))],
  };
}
async function sessionFor(usuario_id, transaction) {
  const token = newToken();
  await Sessions.create(
    {
      usuario_id,
      token_hash: hashToken(token),
      fecha_creacion: new Date(),
      fecha_expiracion: new Date(Date.now() + 7 * 86400000),
    },
    { transaction },
  );
  return token;
}
export async function register(data) {
  const password_hash = await hashPassword(data.password);
  return atomic(async (transaction) => {
    assert(
      !(await Users.findOne({ where: { email: data.email }, transaction })),
      409,
      'EMAIL_EXISTS',
      'Ese correo ya está registrado.',
    );
    const role = await Roles.findOne({ where: { nombre: 'Cliente', sistema: true }, transaction });
    assert(role, 503, 'DB_NOT_READY', 'Primero inicializá los roles del sistema.');
    const user = await Users.create(
      {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        password_hash,
        fecha_registro: new Date(),
      },
      { transaction },
    );
    await UserRoles.create(
      { usuario_id: user.id, rol_id: role.id, fecha_asignacion: new Date() },
      { transaction },
    );
    const token = await sessionFor(user.id, transaction);
    await audit(transaction, user.id, 'CU001_REGISTRO', 'cuentas');
    return { user: publicUser(await loadUser(user.id, transaction)), token };
  });
}
async function loginImpl({ email, password }) {
  const existing = await Users.findOne({ where: { email } });
  const valid = existing
    ? await verifyPassword(password, existing.password_hash)
    : (await hashPassword(password), false);
  const result = await atomic(async (transaction) => {
    const user = existing ? await loadUser(existing.id, transaction) : null;
    if (
      !valid ||
      !user ||
      user.password_hash !== existing.password_hash ||
      user.estado !== 'activo'
    ) {
      await audit(
        transaction,
        user?.id || null,
        'CU002_LOGIN',
        'cuentas',
        'fallido',
        'Acceso denegado',
      );
      return null;
    }
    await user.update({ ultima_conexion: new Date() }, { transaction });
    const token = await sessionFor(user.id, transaction);
    await audit(transaction, user.id, 'CU002_LOGIN', 'cuentas');
    return { user: publicUser(user), token };
  });
  assert(
    result,
    401,
    'INVALID_CREDENTIALS',
    'Correo o contraseña incorrectos, o cuenta no habilitada.',
  );
  return result;
}
export const login = (...args) =>
  new Usuario({}, { iniciarSesion: () => loginImpl(...args) }).iniciarSesion();
export async function authenticate(token) {
  assert(
    token && /^[A-Za-z0-9_-]{43}$/.test(token),
    401,
    'UNAUTHENTICATED',
    'Iniciá sesión para continuar.',
  );
  return verified(
    async (transaction) => {
      const session = await Sessions.findOne({
        where: { token_hash: hashToken(token), fecha_expiracion: { [Op.gt]: new Date() } },
        transaction,
      });
      assert(session, 401, 'SESSION_EXPIRED', 'Tu sesión venció. Volvé a ingresar.');
      const user = await loadUser(session.usuario_id, transaction);
      assert(user?.estado === 'activo', 401, 'ACCOUNT_DISABLED', 'La cuenta no está habilitada.');
      return publicUser(user);
    },
    ['usuarios', 'roles', 'usuario_roles', 'sesiones'],
  );
}
async function logoutImpl(userId, token) {
  return atomic(async (transaction) => {
    await Sessions.destroy({
      where: { usuario_id: userId, token_hash: hashToken(token) },
      transaction,
    });
    await audit(transaction, userId, 'CU003_LOGOUT', 'cuentas');
  });
}
export const logout = (...args) =>
  new Usuario({}, { cerrarSesion: () => logoutImpl(...args) }).cerrarSesion();
async function updateProfileImpl(userId, changes) {
  return atomic(async (transaction) => {
    const user = await loadUser(userId, transaction);
    assert(user?.estado === 'activo', 401, 'ACCOUNT_DISABLED', 'La cuenta no está habilitada.');
    const { telefono, ...fields } = changes;
    if (telefono !== undefined) fields.telefono_cifrado = encrypt(telefono);
    await user.update(fields, { transaction });
    await audit(transaction, userId, 'CU005_PERFIL', 'cuentas');
    return publicUser(user);
  });
}
export const updateProfile = (...args) =>
  new Cliente({}, { actualizarDatos: () => updateProfileImpl(...args) }).actualizarDatos();
async function requestRecoveryImpl(email) {
  const token = newToken();
  const user = await atomic(async (transaction) => {
    const user = await Users.findOne({ where: { email, estado: 'activo' }, transaction });
    if (!user) {
      await audit(transaction, null, 'CU004_SOLICITUD', 'cuentas');
      return null;
    }
    await Resets.destroy({ where: { usuario_id: user.id }, transaction });
    await Resets.create(
      {
        usuario_id: user.id,
        token_hash: hashToken(token),
        fecha_creacion: new Date(),
        fecha_expiracion: new Date(Date.now() + 30 * 60000),
      },
      { transaction },
    );
    await audit(transaction, user.id, 'CU004_SOLICITUD', 'cuentas');
    return { id: user.id, email: user.email };
  });
  if (user) {
    try {
      await sendRecovery(user.email, token);
    } catch {
      await atomic((transaction) =>
        audit(
          transaction,
          user.id,
          'CU004_ENVIO',
          'cuentas',
          'fallido',
          'Entrega de correo no disponible',
        ),
      );
    }
  }
  return {
    message:
      'Si el correo corresponde a una cuenta habilitada, recibirás un enlace de recuperación.',
  };
}
export const requestRecovery = (...args) =>
  new Usuario({}, { recuperarPassword: () => requestRecoveryImpl(...args) }).recuperarPassword();
async function resetPasswordImpl(token, password) {
  const password_hash = await hashPassword(password);
  return atomic(async (transaction) => {
    const reset = await Resets.findOne({
      where: {
        token_hash: hashToken(token),
        usado: false,
        fecha_expiracion: { [Op.gt]: new Date() },
      },
      transaction,
    });
    assert(reset, 400, 'INVALID_RESET', 'El enlace no es válido o venció. Solicitá uno nuevo.');
    const user = await Users.findByPk(reset.usuario_id, { transaction });
    assert(
      user?.estado === 'activo',
      400,
      'INVALID_RESET',
      'El enlace no es válido o venció. Solicitá uno nuevo.',
    );
    await user.update({ password_hash }, { transaction });
    await reset.update({ usado: true }, { transaction });
    await Sessions.destroy({ where: { usuario_id: user.id }, transaction });
    await audit(transaction, user.id, 'CU004_RESTABLECER', 'cuentas');
    return { message: 'Contraseña actualizada. Iniciá sesión con tu nueva contraseña.' };
  });
}
export const resetPassword = (...args) =>
  new Usuario({}, { recuperarPassword: () => resetPasswordImpl(...args) }).recuperarPassword();
export async function assertAdminRemains(userId, transaction) {
  const admins = await Users.findAll({
    where: { estado: 'activo' },
    include: [
      {
        model: Roles,
        as: 'roles',
        where: { nombre: 'Administrador', sistema: true },
        required: true,
      },
    ],
    transaction,
  });
  assert(
    !admins.some((u) => u.id === userId) || admins.some((u) => u.id !== userId),
    409,
    'LAST_ADMIN',
    'Debe quedar al menos un administrador activo.',
  );
}
export async function deleteUserData(userId, actorId, transaction) {
  await assertAdminRemains(userId, transaction);
  const workoutIds = (
    await models.entrenamientos.findAll({
      where: { usuario_id: userId },
      attributes: ['id'],
      transaction,
    })
  ).map((v) => v.id);
  const routineIds = (
    await models.rutinas.findAll({ where: { usuario_id: userId }, attributes: ['id'], transaction })
  ).map((v) => v.id);
  const dietIds = (
    await models.dietas.findAll({ where: { usuario_id: userId }, attributes: ['id'], transaction })
  ).map((v) => v.id);
  const chatIds = (
    await models.conversaciones.findAll({
      where: { usuario_id: userId },
      attributes: ['id'],
      transaction,
    })
  ).map((v) => v.id);
  for (const [table, field, ids] of [
    ['entrenamiento_ejercicios', 'entrenamiento_id', workoutIds],
    ['rutina_ejercicios', 'rutina_id', routineIds],
    ['dieta_comidas', 'dieta_id', dietIds],
    ['mensajes', 'conversacion_id', chatIds],
  ]) {
    if (ids.length) await models[table].destroy({ where: { [field]: ids }, transaction });
  }
  for (const table of [
    'entrenamientos',
    'rutinas',
    'dietas',
    'objetivos',
    'mediciones_fisicas',
    'comidas_consumidas',
    'conversaciones',
    'sesiones',
    'recuperaciones',
    'usuario_roles',
  ])
    await models[table].destroy({ where: { usuario_id: userId }, transaction });
  await models.bitacora.update(
    { usuario_id: null },
    { where: { usuario_id: userId }, transaction },
  );
  await Users.destroy({ where: { id: userId }, transaction });
  await audit(
    transaction,
    actorId === userId ? null : actorId,
    actorId === userId ? 'CU006_ELIMINAR_CUENTA' : 'CU039_ELIMINAR_USUARIO',
    'cuentas',
    'exitoso',
    'Datos personales eliminados',
  );
}
export async function deleteAccount(userId, password) {
  const user = await Users.findByPk(userId);
  assert(
    user && (await verifyPassword(password, user.password_hash)),
    403,
    'PASSWORD_REQUIRED',
    'Confirmá tu contraseña actual.',
  );
  return atomic(async (transaction) => {
    const current = await Users.findByPk(userId, { transaction });
    assert(
      current?.estado === 'activo' && current.password_hash === user.password_hash,
      403,
      'PASSWORD_REQUIRED',
      'La cuenta cambió. Volvé a iniciar sesión.',
    );
    return deleteUserData(userId, userId, transaction);
  });
}
