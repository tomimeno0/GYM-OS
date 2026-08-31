# Pruebas y evidencia

## Entorno

Node 24, MySQL 8.4 real en contenedor aislado, React/Vite, Express y Sequelize. Las suites no sustituyen la base por arrays ni SQLite. `gym_os_test` es exclusiva de pruebas; `npm test` la reinicializa. E2E usa el build de producción con API real en el puerto 3100.

## Resultado consolidado

31/08/2026: **52 pruebas de backend y 14 pruebas de navegador aprobadas**. Build y formato correctos. Se ejecutó además una llamada real a Cohere y se validó su JSON estructurado.

## Cobertura

- **Seguridad e integración:** registro, duplicados, inyección de campos/roles, contraseñas, CSRF, sesiones, expiración, recuperación, cifrado, permisos, bloqueo/activación, último administrador y eliminación.
- **Integridad:** alteración deliberada fuera de Sequelize, detección DVH/DVV, rechazo de escritura, concurrencia y transacciones.
- **Fitness:** perfil e historial, metas, progreso, rutinas, rollback, snapshot de entrenamiento, cargas, sesiones, dietas, ingredientes, macros, borrados y aislamiento.
- **IA:** CU015, CU019, CU023, CU026 y CU031; falta de contexto, generación, adaptación, validación, tipo IA, persistencia, bitácora, conversación, continuación y rechazo fuera de alcance. Un smoke test separado comprobó Cohere real; integración/E2E usan un proveedor determinista activado solo con `AI_MOCK=true`.
- **Contrato UML:** todas las clases y nombres literales de métodos existen, ejecutan su operación y están conectados a los servicios de dominio.
- **Navegador:** recorridos reales de escritorio y móvil para cuenta, perfil, objetivo, rutina manual/IA, entrenamiento, plan manual/IA, consumo, chat, recuperación, catálogo y administración.
- **Accesibilidad:** axe WCAG A/AA en pantallas principales, etiquetas y ausencia de desborde horizontal. No equivale a una certificación completa.

## Revisión visual real

Después de pasar los recorridos funcionales se inspeccionó el Asistente IA en 1440×1000 y 390×844. Se revisaron jerarquía, controles, estados, historial, mensajes, columna móvil y desborde. Las capturas usan exclusivamente una cuenta ficticia.

La emulación móvil verifica diseño y operación táctil en Chromium; no equivale a una prueba en teléfono físico ni cubre Safari/Firefox.

## Reproducir

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
npm audit
```

No ejecutes integración y E2E a la vez porque ambas usan `gym_os_test`. Playwright guarda reportes y trazas en rutas excluidas de Git. Para una prueba automatizada determinista de IA usa `AI_MOCK=true`; para el proveedor real configura `COHERE_API_KEY` de manera privada.

## Límites

No se comprobó SMTP de producción, restauración sobre datos reales, carga masiva, HTTPS público ni otros navegadores. Una respuesta correcta del proveedor en el smoke test no garantiza su disponibilidad futura ni reemplaza límites, monitorización y revisión profesional de los planes.

## Capturas

- [Asistente IA de escritorio](screenshots/asistente-desktop.png)
- [Asistente IA móvil](screenshots/asistente-mobile.png)
- [Chat IA de escritorio](screenshots/asistente-chat-desktop.png)
- [Chat IA móvil](screenshots/asistente-chat-mobile.png)
- [Panel de escritorio](screenshots/panel-desktop.png)
- [Panel móvil](screenshots/panel-mobile.png)
- [Nutrición móvil](screenshots/nutricion-mobile.png)
- [Detalle de rutina](screenshots/rutina-desktop.png)
