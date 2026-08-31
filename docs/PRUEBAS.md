# Pruebas y evidencia

## Entorno

Node 24, MySQL 8.4 real en contenedor aislado, React/Vite, Express y Sequelize. Las suites no sustituyen la base por arrays ni SQLite. `gym_os_test` es exclusiva de pruebas; `npm test` la reinicializa. E2E usa el build de producción con API real en el puerto 3100.

## Resultado consolidado

31/08/2026: **60 pruebas de backend, 14 pruebas de navegador y 5 pruebas de proveedor real aprobadas**. Cobertura: **91,40 % de líneas, 89,05 % de ramas y 94,42 % de funciones**. Build y formato correctos. La prueba real cubre generación, adaptación y persistencia con MySQL para los cinco casos de IA, además de los tres contratos estructurados de producción.

## Cobertura

- **Seguridad e integración:** registro, duplicados, inyección de campos/roles, contraseñas, CSRF, sesiones, expiración, recuperación, cifrado, permisos, bloqueo/activación, último administrador y eliminación.
- **Integridad:** alteración deliberada fuera de Sequelize, detección DVH/DVV, rechazo de escritura, concurrencia y transacciones.
- **Fitness:** perfil e historial, metas, progreso, rutinas, rollback, snapshot de entrenamiento, cargas, sesiones, dietas, ingredientes, macros, borrados y aislamiento.
- **IA:** CU015, CU019, CU023, CU026 y CU031; consentimiento previo, falta de contexto, generación, adaptación, doble validación, tipo IA, persistencia, bitácora, conversación, continuación y negativa fuera de alcance. `tests/real/ai-provider.test.js` prueba con Cohere real; integración/E2E usan un proveedor determinista activado solo con `AI_MOCK=true`.
- **Contrato UML/secuencias:** todas las clases y nombres literales del UML existen y ejecutan; los mensajes que difieren en las secuencias también existen. Un mapa explícito comprueba un export de servicio invocable por cada método, en vez de buscar texto incidental en archivos.
- **Navegador:** recorridos reales de escritorio y móvil para cuenta, perfil, objetivo, rutina manual/IA, entrenamiento, plan manual/IA, consumo, chat, recuperación, catálogo y administración.
- **Accesibilidad:** axe WCAG A/AA en pantallas principales, etiquetas y ausencia de desborde horizontal. No equivale a una certificación completa.

## Revisión visual real

Después de pasar los recorridos funcionales se inspeccionó el Asistente IA en 1440×900 y 390×844. Se revisaron jerarquía, controles, consentimiento revocable, estados habilitados/deshabilitados, historial, columna móvil, consola y desborde. Las capturas usan exclusivamente una cuenta ficticia.

La emulación móvil verifica diseño y operación táctil en Chromium; no equivale a una prueba en teléfono físico ni cubre Safari/Firefox.

## Reproducir

```sh
npm test
npm run test:ai:real
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
npm audit
```

No ejecutes integración y E2E a la vez porque ambas usan `gym_os_test`. `npm run test:e2e` reconstruye React antes de iniciar el servidor, para no probar un `dist` obsoleto. Playwright guarda reportes y trazas en rutas excluidas de Git. `npm run test:ai:real` requiere `COHERE_API_KEY` privada y consume cuota del proveedor.

## Límites

No se comprobó SMTP de producción, restauración sobre datos reales, carga masiva, HTTPS público ni otros navegadores. Una prueba correcta del proveedor no garantiza su disponibilidad futura ni reemplaza monitorización y revisión profesional de los planes. La aplicación verifica disponibilidad, aplica timeout/reintento y nunca persiste respuestas inválidas o fuera de los límites de seguridad.

## Capturas

- [Asistente IA de escritorio](screenshots/asistente-desktop.png)
- [Asistente IA móvil](screenshots/asistente-mobile.png)
- [Chat IA de escritorio](screenshots/asistente-chat-desktop.png)
- [Chat IA móvil](screenshots/asistente-chat-mobile.png)
- [Panel de escritorio](screenshots/panel-desktop.png)
- [Panel móvil](screenshots/panel-mobile.png)
- [Nutrición móvil](screenshots/nutricion-mobile.png)
- [Detalle de rutina](screenshots/rutina-desktop.png)
