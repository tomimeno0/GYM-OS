import { pathToFileURL } from 'node:url';
import { models } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { atomic, audit } from '../services/integrity.js';
import { hashPassword } from '../services/security.js';
import { PERMISSIONS } from '@gym-os/shared/constants';

export async function seed({ demo = false } = {}) {
  const demoPassword = process.env.DEMO_PASSWORD;
  if (demo && !demoPassword)
    throw new Error('Configurá DEMO_PASSWORD antes de crear usuarios de demostración.');
  const hash = demo ? await hashPassword(demoPassword) : null;
  await atomic(async (transaction) => {
    for (const [nombre, permisos] of [
      ['Cliente', ['fitness:use']],
      ['Administrador', PERMISSIONS],
    ])
      await models.roles.findOrCreate({
        where: { nombre },
        defaults: {
          permisos,
          sistema: true,
          descripcion: `Rol del sistema: ${nombre}`,
          fecha_creacion: new Date(),
        },
        transaction,
      });
    if (!demo) return;
    for (const [nombre, email, roleName] of [
      ['Alex', 'cliente@gym-os.demo', 'Cliente'],
      ['Admin', 'admin@gym-os.demo', 'Administrador'],
    ]) {
      const [user, created] = await models.usuarios.findOrCreate({
        where: { email },
        defaults: { nombre, apellido: 'Demo', password_hash: hash, fecha_registro: new Date() },
        transaction,
      });
      if (created) {
        const role = await models.roles.findOne({ where: { nombre: roleName }, transaction });
        await models.usuario_roles.create(
          { usuario_id: user.id, rol_id: role.id, fecha_asignacion: new Date() },
          { transaction },
        );
        await audit(transaction, user.id, 'DEMO_INICIALIZADO', 'sistema');
      }
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await seed({ demo: process.argv.includes('--demo') });
    console.log('Datos iniciales listos.');
  } finally {
    await sequelize.close();
  }
}
