import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'gym_os_test';
process.env.MAIL_TRANSPORT = 'file';
const { sequelize } = await import('../../api/config/database.js');
const { rootDir } = await import('../../api/config/env.js');
const { migrate } = await import('../../api/db/migrate.js');
const { seed } = await import('../../api/db/seed.js');
const { models, Integrity } = await import('../../api/models/index.js');
const { schema } = await import('../../api/db/schema.js');
const { atomic, inspectIntegrity } = await import('../../api/services/integrity.js');
const { hashPassword } = await import('../../api/services/security.js');
const { app } = await import('../../api/app.js');

const prefix = '/api/v1',
  pass = 'Prueba segura 2026!';
let admin, user, userId, adminId, clientRole, adminRole;
const write = (agent, method, url, body) =>
  agent[method](prefix + url)
    .set('X-GymOS-Client', 'web')
    .send(body);
before(async () => {
  assert.equal(sequelize.getDatabaseName(), 'gym_os_test', 'Refuse to touch any non-test database');
  // Dedicated test database only. Never target the application database.
  const qi = sequelize.getQueryInterface();
  const existing = await qi.showAllTables();
  for (const table of [
    'digitos_verificadores',
    ...Object.keys(schema).reverse(),
    'schema_migrations',
  ])
    if (existing.includes(table)) await qi.dropTable(table);
  await migrate();
  await seed();
  const hash = await hashPassword(pass);
  await atomic(async (transaction) => {
    clientRole = await models.roles.findOne({ where: { nombre: 'Cliente' }, transaction });
    adminRole = await models.roles.findOne({ where: { nombre: 'Administrador' }, transaction });
    const u = await models.usuarios.create(
      {
        nombre: 'Admin',
        email: 'admin@accounts.test',
        password_hash: hash,
        fecha_registro: new Date(),
      },
      { transaction },
    );
    adminId = u.id;
    await models.usuario_roles.create(
      { usuario_id: u.id, rol_id: adminRole.id, fecha_asignacion: new Date() },
      { transaction },
    );
  });
  admin = request.agent(app);
  user = request.agent(app);
  const login = await write(admin, 'post', '/auth/login', {
    email: 'admin@accounts.test',
    password: pass,
  });
  assert.equal(login.status, 200, JSON.stringify(login.body));
});
after(async () => {
  await sequelize.close();
});

test('accounts and administration use real MySQL and enforce sequence alternatives', async (t) => {
  await t.test(
    'CU001 registration stores a hash, session and default role without leaking secrets',
    async () => {
      const res = await write(user, 'post', '/auth/register', {
        nombre: 'Alex',
        apellido: 'Demo',
        email: 'alex@accounts.test',
        password: pass,
      });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      userId = res.body.user.id;
      assert.deepEqual(res.body.user.permisos, ['fitness:use']);
      assert.match(res.headers['set-cookie'][0], /HttpOnly/);
      assert.match(res.headers['set-cookie'][0], /SameSite=Lax/);
      assert.equal(res.body.user.password_hash, undefined);
      const stored = await models.usuarios.findByPk(userId);
      assert.notEqual(stored.password_hash, pass);
      assert.match(stored.password_hash, /^scrypt\$/);
      assert.equal((await inspectIntegrity()).ok, true);
    },
  );
  await t.test(
    'CU001 duplicated email, invalid fields and role injection cannot create accounts',
    async () => {
      const dup = await write(user, 'post', '/auth/register', {
        nombre: 'Otro',
        email: 'ALEX@ACCOUNTS.TEST',
        password: pass,
      });
      assert.equal(dup.status, 409, JSON.stringify(dup.body));
      const invalid = await write(user, 'post', '/auth/register', {
        nombre: 'A',
        email: 'no-email',
        password: 'short',
        roles: [adminRole.id],
      });
      assert.equal(invalid.status, 400);
      assert.equal(await models.usuarios.count(), 2);
    },
  );
  await t.test('CSRF and unauthenticated requests are denied', async () => {
    assert.equal((await request(app).get(prefix + '/me')).status, 401);
    assert.equal((await user.patch(prefix + '/me').send({ nombre: 'Otra' })).status, 403);
    assert.equal(
      (
        await user
          .patch(prefix + '/me')
          .set('X-GymOS-Client', 'web')
          .set('Origin', 'https://untrusted.example')
          .send({ nombre: 'Otra' })
      ).status,
      403,
    );
  });
  await t.test(
    'CU005 personal data updates round-trip while phone is encrypted at rest',
    async () => {
      const res = await write(user, 'patch', '/me', {
        nombre: 'Alexandra',
        telefono: '+54 11 1234 5678',
        fecha_nacimiento: '2000-01-02',
        genero: 'otro',
        zona_horaria: 'America/Argentina/Buenos_Aires',
      });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.user.telefono, '+54 11 1234 5678');
      const stored = await models.usuarios.findByPk(userId);
      assert.ok(!stored.telefono_cifrado.includes('1234'));
      assert.equal(
        (await write(user, 'patch', '/me', { estado: 'activo', permisos: ['users:manage'] }))
          .status,
        400,
      );
    },
  );
  await t.test('CU002 invalid credentials are audited and grant no session', async () => {
    const res = await write(request(app), 'post', '/auth/login', {
      email: 'alex@accounts.test',
      password: 'wrong password',
    });
    assert.equal(res.status, 401);
    assert.equal(res.headers['set-cookie'], undefined);
    assert.ok(
      await models.bitacora.count({ where: { accion: 'CU002_LOGIN', resultado: 'fallido' } }),
    );
  });
  await t.test('CU032 clients cannot reach administrative data or operations', async () => {
    assert.equal((await user.get(prefix + '/admin/users')).status, 403);
    assert.equal(
      (
        await write(user, 'patch', `/admin/users/${adminId}/status`, {
          estado: 'bloqueado',
          confirmar: true,
        })
      ).status,
      403,
    );
    assert.equal((await admin.get(prefix + '/admin/users')).body.total, 2);
  });
  await t.test(
    'CU033-CU036 role definitions, duplicate handling, assignment, revocation and deletion',
    async () => {
      const created = await write(admin, 'post', '/admin/roles', {
        nombre: 'Consulta',
        descripcion: 'Lectura',
        permisos: ['fitness:use', 'users:read'],
      });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      const id = created.body.id;
      assert.equal(
        (
          await write(admin, 'post', '/admin/roles', {
            nombre: 'Consulta',
            permisos: ['fitness:use'],
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await write(admin, 'put', `/admin/roles/${id}`, {
            nombre: 'Consulta',
            descripcion: 'Actualizado',
            permisos: ['fitness:use', 'users:read'],
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await write(admin, 'put', `/admin/users/${userId}/roles`, {
            roles: [id],
            confirmar: true,
          })
        ).status,
        200,
      );
      assert.equal(
        (await user.get(prefix + '/me')).status,
        401,
        'Old sessions must be revoked after role changes',
      );
      await write(user, 'post', '/auth/login', { email: 'alex@accounts.test', password: pass });
      assert.equal((await user.get(prefix + '/admin/users')).status, 200);
      assert.equal(
        (
          await write(user, 'patch', `/admin/users/${adminId}/status`, {
            estado: 'bloqueado',
            confirmar: true,
          })
        ).status,
        403,
      );
      assert.equal(
        (await write(admin, 'delete', `/admin/roles/${id}`, { confirmar: true })).status,
        409,
      );
      await write(admin, 'put', `/admin/users/${userId}/roles`, {
        roles: [clientRole.id],
        confirmar: true,
      });
      assert.equal(
        (await write(admin, 'delete', `/admin/roles/${id}`, { confirmar: true })).status,
        204,
      );
      assert.equal(
        (await write(admin, 'delete', `/admin/roles/${adminRole.id}`, { confirmar: true })).status,
        409,
      );
    },
  );
  await t.test(
    'CU037-CU038 blocking revokes access, requires confirmation and activation restores login',
    async () => {
      await write(user, 'post', '/auth/login', { email: 'alex@accounts.test', password: pass });
      assert.equal(
        (
          await write(admin, 'patch', `/admin/users/${userId}/status`, {
            estado: 'bloqueado',
            confirmar: false,
          })
        ).status,
        400,
      );
      assert.equal((await user.get(prefix + '/me')).status, 200);
      assert.equal(
        (
          await write(admin, 'patch', `/admin/users/${userId}/status`, {
            estado: 'bloqueado',
            confirmar: true,
          })
        ).status,
        200,
      );
      assert.equal((await user.get(prefix + '/me')).status, 401);
      assert.equal(
        (await write(user, 'post', '/auth/login', { email: 'alex@accounts.test', password: pass }))
          .status,
        401,
      );
      assert.equal(
        (
          await write(admin, 'patch', `/admin/users/${userId}/status`, {
            estado: 'activo',
            confirmar: true,
          })
        ).status,
        200,
      );
      assert.equal(
        (await write(user, 'post', '/auth/login', { email: 'alex@accounts.test', password: pass }))
          .status,
        200,
      );
    },
  );
  await t.test('last administrator cannot be blocked, stripped of roles or deleted', async () => {
    assert.equal(
      (
        await write(admin, 'patch', `/admin/users/${adminId}/status`, {
          estado: 'bloqueado',
          confirmar: true,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await write(admin, 'put', `/admin/users/${adminId}/roles`, {
          roles: [clientRole.id],
          confirmar: true,
        })
      ).status,
      409,
    );
    assert.equal(
      (await write(admin, 'delete', `/admin/users/${adminId}`, { confirmar: true })).status,
      409,
    );
  });
  await t.test(
    'CU004 recovery is delivered only through mail, token is single-use and revokes sessions',
    async () => {
      const dir = path.join(rootDir, '.local/mail');
      const known = await write(request(app), 'post', '/auth/forgot-password', {
        email: 'alex@accounts.test',
      });
      const unknown = await write(request(app), 'post', '/auth/forgot-password', {
        email: 'nobody@accounts.test',
      });
      assert.deepEqual(known.body, unknown.body);
      assert.equal(known.status, 200);
      const files = (await readdir(dir)).sort().reverse();
      let message;
      for (const f of files) {
        const data = JSON.parse(await readFile(path.join(dir, f), 'utf8'));
        if (data.to === 'alex@accounts.test') {
          message = data;
          break;
        }
      }
      assert.ok(message);
      const token = new URL(message.text.match(/http[^\s]+/)[0]).searchParams.get('token');
      const rows = await models.recuperaciones.findAll({ where: { usuario_id: userId } });
      assert.notEqual(rows[0].token_hash, token);
      const reset = await write(request(app), 'post', '/auth/reset-password', {
        token,
        password: pass + ' nuevo',
      });
      assert.equal(reset.status, 200, JSON.stringify(reset.body));
      assert.equal((await user.get(prefix + '/me')).status, 401);
      assert.equal(
        (await write(request(app), 'post', '/auth/reset-password', { token, password: pass }))
          .status,
        400,
      );
      assert.equal(
        (await write(user, 'post', '/auth/login', { email: 'alex@accounts.test', password: pass }))
          .status,
        401,
      );
      assert.equal(
        (
          await write(user, 'post', '/auth/login', {
            email: 'alex@accounts.test',
            password: pass + ' nuevo',
          })
        ).status,
        200,
      );
    },
  );
  await t.test(
    'CU003 logout requires confirmation and invalidates the server session',
    async () => {
      assert.equal((await write(user, 'post', '/auth/logout', { confirmar: false })).status, 400);
      assert.equal((await user.get(prefix + '/me')).status, 200);
      assert.equal((await write(user, 'post', '/auth/logout', { confirmar: true })).status, 204);
      assert.equal((await user.get(prefix + '/me')).status, 401);
      await write(user, 'post', '/auth/login', {
        email: 'alex@accounts.test',
        password: pass + ' nuevo',
      });
    },
  );
  await t.test('CU004 expired tokens fail without changing the password', async () => {
    await write(request(app), 'post', '/auth/forgot-password', { email: 'alex@accounts.test' });
    const files = (await readdir(path.join(rootDir, '.local/mail'))).sort().reverse();
    let token;
    for (const file of files) {
      const message = JSON.parse(await readFile(path.join(rootDir, '.local/mail', file), 'utf8'));
      if (message.to === 'alex@accounts.test') {
        token = new URL(message.text.match(/http[^\s]+/)[0]).searchParams.get('token');
        break;
      }
    }
    await atomic((transaction) =>
      models.recuperaciones.update(
        { fecha_expiracion: new Date(Date.now() - 1000) },
        { where: { usuario_id: userId }, transaction },
      ),
    );
    assert.equal(
      (
        await write(request(app), 'post', '/auth/reset-password', {
          token,
          password: 'Contraseña intrusa',
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await write(user, 'post', '/auth/login', {
          email: 'alex@accounts.test',
          password: pass + ' nuevo',
        })
      ).status,
      200,
    );
  });
  await t.test('concurrent registrations cannot bypass the unique email rule', async () => {
    const data = { nombre: 'Concurrente', email: 'concurrent@accounts.test', password: pass };
    const results = await Promise.all([
      write(request(app), 'post', '/auth/register', data),
      write(request(app), 'post', '/auth/register', data),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    assert.equal(await models.usuarios.count({ where: { email: data.email } }), 1);
  });
  await t.test(
    'integrity detects out-of-band tampering and refuses to bless it through a write',
    async () => {
      const before = await models.usuarios.findByPk(userId);
      await sequelize.query('UPDATE usuarios SET nombre = :nombre WHERE id = :id', {
        replacements: { nombre: 'Tampered', id: userId },
      });
      assert.equal((await inspectIntegrity()).ok, false);
      assert.equal((await write(user, 'patch', '/me', { nombre: 'Legit' })).status, 503);
      // Restore exactly the deliberately modified test field; never recalculate the hash.
      await sequelize.query('UPDATE usuarios SET nombre = :nombre WHERE id = :id', {
        replacements: { nombre: before.nombre, id: userId },
      });
      assert.equal((await inspectIntegrity()).ok, true);
      const report = await admin.get(prefix + '/admin/integrity');
      assert.equal(report.status, 200);
      assert.equal(report.body.ok, true);
    },
  );
  await t.test(
    'CU006 account deletion requires password and confirmation, removes personal data and sessions',
    async () => {
      assert.equal(
        (await write(user, 'delete', '/me', { confirmar: true, password: 'incorrecta' })).status,
        403,
      );
      assert.equal(
        (await write(user, 'delete', '/me', { confirmar: true, password: pass + ' nuevo' })).status,
        204,
      );
      assert.equal(await models.usuarios.findByPk(userId), null);
      assert.equal(await models.sesiones.count({ where: { usuario_id: userId } }), 0);
      assert.equal(await models.bitacora.count({ where: { usuario_id: userId } }), 0);
      assert.equal((await inspectIntegrity()).ok, true);
    },
  );
  await t.test(
    'CU039 admin deletion and bitacora filters work without leaking passwords or recovery tokens',
    async () => {
      const disposable = await write(request(app), 'post', '/auth/register', {
        nombre: 'Temporal',
        email: 'temporary@accounts.test',
        password: pass,
      });
      assert.equal(
        (
          await write(admin, 'delete', `/admin/users/${disposable.body.user.id}`, {
            confirmar: true,
          })
        ).status,
        204,
      );
      const log = await admin.get(prefix + '/admin/audit?modulo=cuentas&resultado=fallido');
      assert.equal(log.status, 200);
      assert.ok(log.body.total > 0);
      assert.ok(!JSON.stringify(log.body).includes(pass));
    },
  );
});

test('initial administrator creation never elevates an existing account', async () => {
  const { createAdmin } = await import('../../api/db/create-admin.js');
  const normal = request.agent(app);
  const email = 'bootstrap-existing@accounts.test';
  assert.equal(
    (
      await write(normal, 'post', '/auth/register', {
        nombre: 'Cliente de prueba',
        email,
        password: pass,
      })
    ).status,
    201,
  );
  await assert.rejects(
    createAdmin({ nombre: 'Intento de elevar', email, password: pass }),
    (e) => e.code === 'EMAIL_EXISTS',
  );
  const me = await normal.get(prefix + '/me');
  assert.deepEqual(me.body.user.permisos, ['fitness:use']);
  const created = await createAdmin({
    nombre: 'Administrador nuevo',
    email: 'bootstrap-new@accounts.test',
    password: pass,
  });
  assert.ok(created.id);
  const newAdmin = request.agent(app);
  assert.equal(
    (
      await write(newAdmin, 'post', '/auth/login', {
        email: 'bootstrap-new@accounts.test',
        password: pass,
      })
    ).status,
    200,
  );
  assert.equal((await newAdmin.get(prefix + '/admin/integrity')).body.ok, true);
});

test('SMTP failure cannot reveal whether a recovery email belongs to an account', async () => {
  const agent = request.agent(app),
    email = 'smtp-failure@accounts.test';
  const registered = await write(agent, 'post', '/auth/register', {
    nombre: 'Correo de prueba',
    email,
    password: pass,
  });
  assert.equal(registered.status, 201);
  const previous = Object.fromEntries(
    ['MAIL_TRANSPORT', 'SMTP_HOST', 'SMTP_PORT'].map((k) => [k, process.env[k]]),
  );
  try {
    process.env.MAIL_TRANSPORT = 'smtp';
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = '1';
    const known = await write(agent, 'post', '/auth/forgot-password', { email });
    const unknown = await write(agent, 'post', '/auth/forgot-password', {
      email: 'absent-smtp@accounts.test',
    });
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.deepEqual(known.body, unknown.body);
    assert.equal(
      await models.bitacora.count({
        where: { usuario_id: registered.body.user.id, accion: 'CU004_ENVIO', resultado: 'fallido' },
      }),
      1,
    );
  } finally {
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
