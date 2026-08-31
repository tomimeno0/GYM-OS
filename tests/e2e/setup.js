export default async function setup() {
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'gym_os_test';
  const { migrate } = await import('../../api/db/migrate.js');
  const { seed } = await import('../../api/db/seed.js');
  const { sequelize } = await import('../../api/config/database.js');
  if (sequelize.getDatabaseName() !== 'gym_os_test')
    throw new Error('E2E requiere la base de pruebas.');
  try {
    await migrate();
    await seed({ demo: true });
  } finally {
    await sequelize.close();
  }
}
