# GYM-OS

Sistema de entrenamiento, nutrición y seguimiento personal con administración de usuarios. JavaScript, React, Express, Sequelize y MySQL. Implementación basada en UML y 39 diagramas de secuencia del proyecto.

**En construcción:** la base de datos y los servicios de cuentas/administración ya tienen pruebas de integración. Los módulos fitness, IA y frontend aún están en desarrollo. No es una entrega final.

## Requisitos

- Node.js 22.12 o superior (desarrollo probado con Node 24).
- Docker con Compose y MySQL 8.4. En macOS también puede usarse Colima.

## Preparación

```sh
npm ci
npm run setup
docker compose up -d mysql
npm run db:migrate
npm run db:seed -- --demo
```

`setup` crea `.env` con claves aleatorias y no sobrescribe configuraciones existentes. Los usuarios ficticios son `cliente@gym-os.demo` y `admin@gym-os.demo`; su contraseña es el valor `DEMO_PASSWORD` en tu `.env` local. No subas ese archivo a Git.

MySQL escucha en `127.0.0.1:3307`. El usuario de DB predeterminado es `gymos`; el script inicial crea la base de pruebas `gym_os_test`. Si cambiás `DB_USER`, adaptá también `scripts/mysql-init.sql` antes de inicializar el volumen.

Para Colima, usá tu contexto Docker: `docker --context colima-gymos compose …`. Si Compose está instalado como ejecutable independiente, `docker-compose --context colima-gymos …` es equivalente.

## API y pruebas actuales

```sh
npm start
npm test
npm audit
```

API en `http://localhost:3000/api/v1`, salud en `/api/health`. Las escrituras requieren cabecera `X-GymOS-Client: web`. Sesión mediante cookie HttpOnly. Pruebas de integración usan y reinicializan **sólo `gym_os_test`**; no apuntarlas a una base con datos reales.

En desarrollo, recuperación de contraseña escribe el correo en `.local/mail/` (privado). En producción configurá SMTP y `APP_ORIGIN` HTTPS. Nunca se devuelve el token por la API.

## Documentación

- [Requisitos y trazabilidad](docs/REQUISITOS.md)
- [Arquitectura y frontend](docs/ARQUITECTURA.md)
- [Estado de implementación](docs/ESTADO.md)

Los adjuntos originales se mantienen fuera del repositorio público para preservar datos personales. Los datos de prueba son ficticios.
