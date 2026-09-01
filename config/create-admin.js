import { pathToFileURL } from 'node:url';
import { registerSchema } from '@gym-os/shared/schemas';
import { seed } from './seed.js';
import { models } from '../models/index.js';
import { sequelize } from './db.js';
import { hashPassword } from '../controllers/security.controller.js';
import { atomic, audit } from '../controllers/integrity.controller.js';
import { assert } from '../controllers/errors.controller.js';

export async function createAdmin(data) {
  const valid = registerSchema.parse(data);
  await seed();
  const password_hash = await hashPassword(valid.password);
  return atomic(async (transaction) => {
    assert(
      !(await models.usuarios.findOne({ where: { email: valid.email }, transaction })),
      409,
      'EMAIL_EXISTS',
      'La cuenta ya existe. Sus permisos no fueron modificados.',
    );
    const role = await models.roles.findOne({
      where: { nombre: 'Administrador', sistema: true },
      transaction,
    });
    const user = await models.usuarios.create(
      {
        nombre: valid.nombre,
        apellido: valid.apellido,
        email: valid.email,
        password_hash,
        fecha_registro: new Date(),
      },
      { transaction },
    );
    await models.usuario_roles.create(
      { usuario_id: user.id, rol_id: role.id, fecha_asignacion: new Date() },
      { transaction },
    );
    await audit(transaction, user.id, 'ADMINISTRADOR_INICIAL', 'sistema');
    return { id: user.id };
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
      throw new Error('Configurá ADMIN_EMAIL, ADMIN_NAME y ADMIN_PASSWORD en el entorno privado.');
    await createAdmin({
      nombre: process.env.ADMIN_NAME || 'Administrador',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    console.log('Administrador creado. La contraseña no se imprime ni se guarda en texto plano.');
  } catch (e) {
    console.error(
      e.code || 'CREATE_ADMIN_FAILED',
      e.name === 'ZodError'
        ? 'Revisá nombre, correo y contraseña (mínimo 10 caracteres).'
        : e.message,
    );
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
