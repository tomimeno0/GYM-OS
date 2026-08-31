import { Op } from 'sequelize';
import { models } from '../models/index.js';
import { atomic, verified, audit, inspectIntegrity } from './integrity.js';
import { loadUser, publicUser, assertAdminRemains, deleteUserData } from './accounts.js';
import { assert } from '../lib/errors.js';
import { Administrador } from '../domain/uml.js';

export async function authorizeActor(id, permission, transaction) {
  const user = await loadUser(id, transaction);
  assert(user?.estado === 'activo', 401, 'ACCOUNT_DISABLED', 'La cuenta no está habilitada.');
  assert(
    !permission || publicUser(user).permisos.includes(permission),
    403,
    'FORBIDDEN',
    'No tenés permiso para esta acción.',
  );
  return user;
}
export async function listUsers(actorId, query) {
  return verified(async (transaction) => {
    await authorizeActor(actorId, 'users:read', transaction);
    const where = {};
    if (query.q)
      where[Op.or] = ['nombre', 'apellido', 'email'].map((field) => ({
        [field]: { [Op.like]: `%${query.q}%` },
      }));
    if (query.estado) where.estado = query.estado;
    const { count, rows } = await models.usuarios.findAndCountAll({
      where,
      include: [{ model: models.roles, as: 'roles', through: { attributes: [] } }],
      distinct: true,
      order: [['fecha_registro', 'DESC']],
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
      transaction,
    });
    return {
      total: count,
      items: rows.map((u) => {
        const { telefono, fecha_nacimiento, ...publicFields } = publicUser(u);
        return publicFields;
      }),
    };
  });
}
export async function listRoles(actorId) {
  return verified(async (transaction) => {
    await authorizeActor(actorId, 'roles:manage', transaction);
    return (
      await models.roles.findAll({
        order: [['nombre', 'ASC']],
        attributes: { exclude: ['dvh'] },
        transaction,
      })
    ).map((r) => r.toJSON());
  });
}
async function saveRoleImpl(actorId, id, data) {
  return atomic(async (transaction) => {
    await authorizeActor(actorId, 'roles:manage', transaction);
    const existing = await models.roles.findOne({
      where: { nombre: data.nombre, ...(id ? { id: { [Op.ne]: id } } : {}) },
      transaction,
    });
    assert(!existing, 409, 'ROLE_EXISTS', 'Ya existe un rol con ese nombre.');
    let role;
    if (id) {
      role = await models.roles.findByPk(id, { transaction });
      assert(role, 404, 'NOT_FOUND', 'No se encontró el rol.');
      assert(
        !role.sistema,
        409,
        'SYSTEM_ROLE',
        'Los roles del sistema están protegidos. Creá uno personalizado.',
      );
      await role.update(data, { transaction });
    } else
      role = await models.roles.create({ ...data, fecha_creacion: new Date() }, { transaction });
    await audit(
      transaction,
      actorId,
      id ? 'CU035_MODIFICAR_ROL' : 'CU033_CREAR_ROL',
      'administracion',
    );
    const { dvh, ...result } = role.toJSON();
    return result;
  });
}
export const saveRole = (actorId, id, data) => {
  const operation = id ? 'modificarRoles' : 'crearRoles';
  return new Administrador({}, { [operation]: () => saveRoleImpl(actorId, id, data) })[operation]();
};
async function deleteRoleImpl(actorId, id) {
  return atomic(async (transaction) => {
    await authorizeActor(actorId, 'roles:manage', transaction);
    const role = await models.roles.findByPk(id, { transaction });
    assert(role, 404, 'NOT_FOUND', 'No se encontró el rol.');
    assert(!role.sistema, 409, 'SYSTEM_ROLE', 'No se puede eliminar un rol del sistema.');
    assert(
      !(await models.usuario_roles.count({ where: { rol_id: id }, transaction })),
      409,
      'ROLE_ASSIGNED',
      'Quitá las asignaciones antes de eliminar el rol.',
    );
    await role.destroy({ transaction });
    await audit(transaction, actorId, 'CU036_ELIMINAR_ROL', 'administracion');
  });
}
export const deleteRole = (...args) =>
  new Administrador({}, { modificarRoles: () => deleteRoleImpl(...args) }).modificarRoles();
async function assignRolesImpl(actorId, targetId, roleIds) {
  return atomic(async (transaction) => {
    await authorizeActor(actorId, 'roles:manage', transaction);
    const user = await loadUser(targetId, transaction);
    assert(user, 404, 'NOT_FOUND', 'No se encontró el usuario.');
    const roles = await models.roles.findAll({ where: { id: roleIds }, transaction });
    assert(roles.length === roleIds.length, 400, 'INVALID_ROLES', 'Uno de los roles no existe.');
    if (!roles.some((r) => r.sistema && r.nombre === 'Administrador'))
      await assertAdminRemains(targetId, transaction);
    await models.usuario_roles.destroy({ where: { usuario_id: targetId }, transaction });
    await models.usuario_roles.bulkCreate(
      roles.map((r) => ({ usuario_id: targetId, rol_id: r.id, fecha_asignacion: new Date() })),
      { transaction },
    );
    await models.sesiones.destroy({ where: { usuario_id: targetId }, transaction });
    await audit(transaction, actorId, 'CU034_CU035_ASIGNAR_ROLES', 'administracion');
    return publicUser(await loadUser(targetId, transaction));
  });
}
export const assignRoles = (...args) =>
  new Administrador({}, { asignarRoles: () => assignRolesImpl(...args) }).asignarRoles();
async function changeStatusImpl(actorId, targetId, estado) {
  return atomic(async (transaction) => {
    await authorizeActor(actorId, 'users:manage', transaction);
    const user = await loadUser(targetId, transaction);
    assert(user, 404, 'NOT_FOUND', 'No se encontró el usuario.');
    if (estado === 'bloqueado') await assertAdminRemains(targetId, transaction);
    await user.update({ estado }, { transaction });
    await models.sesiones.destroy({ where: { usuario_id: targetId }, transaction });
    await audit(
      transaction,
      actorId,
      estado === 'activo' ? 'CU038_ACTIVAR_USUARIO' : 'CU037_BLOQUEAR_USUARIO',
      'administracion',
    );
    return publicUser(user);
  });
}
export const changeStatus = (actorId, targetId, estado) => {
  const operation = estado === 'activo' ? 'activarUsuario' : 'bloquearUsuario';
  return new Administrador({}, { [operation]: () => changeStatusImpl(actorId, targetId, estado) })[
    operation
  ]();
};
async function removeUserImpl(actorId, targetId) {
  return atomic(async (transaction) => {
    await authorizeActor(actorId, 'users:manage', transaction);
    assert(
      await models.usuarios.findByPk(targetId, { transaction }),
      404,
      'NOT_FOUND',
      'No se encontró el usuario.',
    );
    await deleteUserData(targetId, actorId, transaction);
  });
}
export const removeUser = (...args) =>
  new Administrador({}, { eliminarUsuario: () => removeUserImpl(...args) }).eliminarUsuario();
export async function listAudit(actorId, query) {
  return verified(async (transaction) => {
    await authorizeActor(actorId, 'audit:read', transaction);
    const where = {};
    if (query.modulo) where.modulo = query.modulo;
    if (query.resultado) where.resultado = query.resultado;
    const { count, rows } = await models.bitacora.findAndCountAll({
      where,
      order: [['fecha_hora', 'DESC']],
      attributes: { exclude: ['dvh'] },
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
      transaction,
    });
    return { total: count, items: rows };
  });
}
export async function integrityReport(actorId) {
  return verified(
    async (transaction) => {
      await authorizeActor(actorId, 'integrity:read', transaction);
      return inspectIntegrity(transaction);
    },
    ['usuarios', 'roles', 'usuario_roles', 'sesiones'],
  );
}
