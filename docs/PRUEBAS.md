# Pruebas y evidencia

## Entorno

Node 24, MySQL 8.4 real en contenedor aislado, React/Vite, Express y Sequelize. Las suites no sustituyen la base por arrays ni SQLite. `gym_os_test` es exclusiva de pruebas; `npm test` la reinicializa. E2E usa el build de producción del frontend con un servidor de pruebas en el puerto 3100.

## Resultado consolidado

31/08/2026: 43 pruebas de backend y 14 pruebas de navegador aprobadas. Build, formato y auditoría npm correctos.

Se repitió la verificación sobre una extracción limpia del árbol de la aplicación: `npm ci`, generación de `.env`, MySQL 8.4 independiente en `DB_PORT=3308`, formato, 43 pruebas, build y 14 E2E. El entorno temporal fue eliminado al finalizar. Esto comprueba la reproducción desde el lockfile sin reutilizar las claves ni el volumen de desarrollo.

## Cobertura

- **Seguridad e integración:** registro, duplicados, inyección de campos/roles, contraseñas, CSRF, sesiones, expiración, recuperación de un solo uso, cifrado de teléfono, acceso por rol, bloqueo/activación, protección del último administrador, eliminación y anonimización de bitácora.
- **Integridad:** alteración deliberada fuera de Sequelize, detección DVH/DVV y rechazo de escritura sin ocultar la alteración; concurrencia y transacciones.
- **Fitness:** perfil inicial e historial, metas coherentes, objetivo activo único, progreso en ambas direcciones, rutinas por día, rollback de edición, snapshot de entrenamiento, cargas reales, sesión única, completado/incompleto/cancelado, dietas e ingredientes, macros por cantidad, borrados y aislamiento entre cuentas.
- **Fechas y datos:** ventanas por zona horaria, día de 23 horas con cambio horario, catálogo completo y licencia, alimentos con nutrientes ausentes frente a valores cero.
- **Navegador:** recorridos reales de escritorio y móvil para cuenta, perfil, objetivo, rutina, entrenamiento, plan, consumo, edición/borrado, recuperación, logout, catálogo y administración. La recuperación lee el correo realmente generado en el transporte local de pruebas; no envía mensajes a terceros.
- **Accesibilidad:** axe con reglas WCAG A/AA en inicio, login, registro, panel y formularios principales. Se comprobaron etiquetas y ausencia de desborde horizontal; se corrigió contraste insuficiente. Una revisión automatizada no equivale a una certificación completa de accesibilidad.
- **IA diferida:** `/api/v1/ai/status` responde 404; no se realizan llamadas a LLM. No se reemplazó por respuestas simuladas.

## Revisión visual real

Después de pasar los recorridos funcionales iniciales se inspeccionaron pantallas reales en el navegador de Codex: panel vacío y con datos ficticios, detalle de rutina, nutrición, navegación móvil y tamaños de escritorio/390 px. Se revisaron tipografía, contraste, tarjetas, formularios, barras de macros, gráfico y desplazamiento. Las capturas documentadas usan exclusivamente una cuenta ficticia.

La emulación móvil verifica diseño y operación con viewport táctil; no equivale a una prueba en un teléfono físico o a cobertura de Safari/Firefox. Las suites usan Chromium. La captura de página completa del navegador integrado produjo un lienzo sobredimensionado, por lo que la inspección fiable usa capturas de viewport y navegación/desplazamiento.

## Reproducir

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
npm audit
```

No ejecutes las suites de integración y E2E al mismo tiempo. Los resultados locales se guardan en `.local/analysis/`; Playwright genera `playwright-report/` y `test-results/`, excluidos de Git porque pueden contener correos, tokens sintéticos y trazas de solicitudes. El estado de la última ejecución completa figura en [ESTADO.md](ESTADO.md).

## Límites de la validación

No se ha comprobado SMTP de producción, una restauración sobre datos reales, carga masiva, despliegue HTTPS público ni la ejecución remota de GitHub Actions. La búsqueda externa de alimentos se validó con el entorno oficial de pruebas de Open Food Facts y el comportamiento de datos incompletos; disponibilidad futura y contenido de terceros no están garantizados.

## Capturas

- [Panel de escritorio](screenshots/panel-desktop.png)
- [Panel móvil](screenshots/panel-mobile.png)
- [Nutrición móvil](screenshots/nutricion-mobile.png)
- [Detalle de rutina](screenshots/rutina-desktop.png)
