# GYM-OS

Entrenamiento, nutrición y progreso en un solo lugar. Aplicación en **JavaScript, React, Express, Sequelize y MySQL**, con interfaz adaptable a escritorio y móvil.

Implementa cuentas, perfil físico e historial, objetivos, rutinas por día, registro de entrenamientos, planes alimentarios, consumo y macros, biblioteca de 1.324 ejercicios y administración de usuarios, roles, bitácora e integridad.

**La IA está diferida por decisión del responsable del proyecto.** No hay proveedor configurado, llamadas a LLM, modelos locales ni generación automática. Los cinco casos de uso de IA se conservan documentados para una etapa posterior.

Estado verificable y pendientes de publicación: [Estado de entrega](docs/ESTADO.md). No se considera publicado hasta comprobar el repositorio remoto.

## Ejecutar localmente

Requisitos: Node.js 22.12 o superior (probado con Node 24), npm y Docker con Compose. MySQL 8.4 usa `127.0.0.1:3307`.

```sh
npm ci
npm run setup
docker compose up -d mysql
npm run db:migrate
npm run db:seed -- --demo
npm run db:demo
npm run dev
```

Esperá a que MySQL esté saludable (`docker compose ps`) antes de migrar. `DB_PORT` configura tanto la aplicación como el puerto publicado por Compose, lo que permite mantener instalaciones aisladas. Abrí **http://localhost:5173**; no uses otro origen sin actualizar `APP_ORIGIN`. La API escucha en el puerto 3000. `npm run db:demo` es opcional: agrega información **ficticia**, sin modificar una cuenta que ya tiene mediciones.

Las cuentas demo son `cliente@gym-os.demo` y `admin@gym-os.demo`. La contraseña aleatoria de ambas está en `DEMO_PASSWORD` dentro de tu `.env`. `setup` no sobrescribe configuraciones ni secretos existentes. **No compartas ni subas `.env`.**

En esta computadora con Colima y Compose independiente: `docker-compose --context colima-gymos up -d mysql`. No altera MariaDB ni el contexto Docker predeterminado.

## Verificación

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
npm audit
```

`npm test` reinicializa **exclusivamente `gym_os_test`**. Nunca uses esa base para datos reales. E2E ejecuta el build con API real en el puerto 3100 y MySQL de pruebas; verifica escritorio y móvil, cuentas, fitness, permisos, administración y accesibilidad. No ejecutes ambas suites simultáneamente. GitHub Actions reproduce la verificación en una instancia efímera de MySQL.

## Estructura

- `client/`: React, rutas, formularios, gráficos y estilos.
- `api/`: Express, servicios, Sequelize, migraciones y seguridad.
- `shared/`: contratos Zod y constantes compartidas.
- `tests/`: pruebas unitarias, integración con MySQL y recorridos Playwright.
- `docs/`: requisitos, arquitectura, uso, operación, pruebas y licencias.

## Uso

Creá una cuenta, registrá tus medidas en **Mi progreso**, definí un objetivo y armá tus rutinas. Iniciá una sesión desde una rutina para registrar cada ejercicio. En **Nutrición**, los planes y lo efectivamente consumido son registros separados: guardar un plan no implica haberlo comido. Los valores nutricionales se ingresan por 100 g/ml o por una porción, y se calculan según la cantidad.

La recuperación de contraseña en desarrollo genera un correo privado en `.local/mail/`. No se envía un correo real hasta configurar SMTP. Para una instalación real, creá tu administrador con `npm run admin:create` y variables privadas `ADMIN_EMAIL`, `ADMIN_NAME` y `ADMIN_PASSWORD`, sin usar las cuentas demo. Ver [operación](docs/OPERACION.md).

## Documentación

- [Requisitos y trazabilidad](docs/REQUISITOS.md)
- [Arquitectura](docs/ARQUITECTURA.md)
- [Guía de uso](docs/USO.md)
- [API](docs/API.md)
- [Instalación, seguridad y respaldo](docs/OPERACION.md)
- [Pruebas y evidencia](docs/PRUEBAS.md)
- [Datos y licencias](docs/DATOS-Y-LICENCIAS.md)

Los adjuntos originales, PDFs, DER privado, datos personales, correos y secretos quedan fuera del repositorio. Los textos del catálogo incluyen su atribución MIT; no se distribuyen imágenes o GIF de licencia separada. GYM-OS organiza información; no sustituye orientación profesional.
