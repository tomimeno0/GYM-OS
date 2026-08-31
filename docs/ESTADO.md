# Estado de entrega

El producto manual está implementado. La IA quedó diferida por pedido explícito del usuario; no es una funcionalidad fallida o simulada. La publicación remota todavía está pendiente y no se declara una entrega final hasta comprobarla.

## Implementado

- Análisis de todos los adjuntos y revisión visual de UML y 27 páginas de secuencias. Precedencia y contradicciones documentadas.
- JavaScript, React, Express, Sequelize y MySQL 8.4. Migraciones versionadas, roles iniciales y datos ficticios opcionales.
- Cuentas, recuperación, perfil, roles/permisos, bloqueo/activación, bitácora, integridad y eliminación de datos personales.
- Medidas históricas, objetivos, rutinas manuales, sesiones con cargas reales, planes alimentarios, registro de consumo, macros y progreso.
- Catálogo textual completo de 1.324 ejercicios con atribución MIT, sin imágenes/GIF con licencia separada.
- Frontend adaptable: inicio, acceso, panel, objetivos, progreso, catálogo, rutinas, entrenamiento, nutrición, cuenta y administración.
- Documentación de instalación, uso, API, seguridad, respaldo, licencias y pruebas. Configuración de GitHub Actions para verificación reproducible.
- Integración IA inicial retirada: sin cliente, servicios, rutas, variables o contenedor de IA. Se detuvo el servidor local iniciado para la tarea, se quitó la descarga del modelo y se desinstaló Ollama junto con las dependencias que esta tarea había agregado; también se retiraron las claves locales que esa ejecución creó. Las tablas/columnas del esquema original reservadas para IA no ejecutan ninguna integración.

## Validación

Verificación final del 31/08/2026: **43 pruebas de backend aprobadas** y **14 pruebas de navegador aprobadas**, en escritorio y móvil. La suite de cuentas se repitió tres veces por separado sin fallos. Build y formato correctos; auditoría npm sin vulnerabilidades. El escaneo de los 83 archivos preparados para Git no encontró valores de los secretos privados del entorno.

También se extrajo el árbol de la aplicación a una ruta limpia, sin `.env` ni `node_modules`; se instalaron dependencias desde el lockfile, se generaron claves nuevas y se levantó una segunda instancia desechable de MySQL 8.4 en el puerto 3308. Esa instalación repitió correctamente las 43 pruebas, el build y los 14 recorridos E2E. El contenedor, volumen y copia temporal se eliminaron después de verificarla.

La revisión visual comprobó panel vacío y con datos, rutinas, nutrición y navegación móvil a 390 px. Se corrigieron contraste, etiquetas de formularios, manejo de errores de conexión y desplazamiento del menú móvil para acceder a cerrar sesión. Las capturas usan datos ficticios y están en `docs/screenshots/`. Consultar [PRUEBAS.md](PRUEBAS.md) para alcance y limitaciones.

## Pendiente externo

Crear y verificar el repositorio público `tomimeno0/GYM-OS`. El conector vinculado no tiene operación para crear repositorios, y tanto Chrome como el navegador integrado mostraron GitHub sin sesión iniciada. Se pidió al usuario iniciar sesión en Chrome. No se publicó código ni se subieron adjuntos privados.

SMTP y hosting de producción requieren configurar un proveedor y un dominio propios. No son necesarios para ejecutar el sistema localmente: el correo de desarrollo queda en archivos privados. No se inventan credenciales, destinatarios ni una URL pública de despliegue.

## Entorno local

Directorio: `gymOS`. MySQL en `127.0.0.1:3307`, perfil/contexto Docker `colima-gymos`; prefijo local `docker-compose --context colima-gymos`. No alterar MariaDB existente ni otros contextos. Frontend: `http://localhost:5173`; API: puerto 3000.

Fuentes y renders privados en `.local/sources` y `.local/analysis`, excluidos de Git. Las secuencias están en el PDF adjunto `GRAFICOS CASOS DE USO.pdf`; no volver a buscarlas en la carpeta vacía.
