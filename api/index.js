import { app } from './app.js';
import { env } from './config/env.js';
import { sequelize } from './config/database.js';
await sequelize.authenticate();
const server = app.listen(env.port, '127.0.0.1', () =>
  console.log(`GYM-OS API: http://localhost:${env.port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    }),
  );
