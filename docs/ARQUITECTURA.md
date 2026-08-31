# Arquitectura y dirección de interfaz

## Organización

Monorepositorio npm workspaces: `api/` (Express, Sequelize, MySQL), `client/` (React, Vite, React Router), `shared/` (validaciones y constantes de dominio), `tests/` (integración y navegador), `docs/` y `scripts/`.

La base de los adjuntos se conserva como estructura, no como funcionalidad ficticia: se reemplazan los arrays/mock de usuarios, CORS abierto y rutas de ejemplo por servicios persistentes. La navegación conserva Inicio `/`, Dashboard `/dashboard`, Nosotros `/nosotros` y Mi perfil `/me`. Se añaden `/objetivos`, `/rutinas`, `/rutinas/:id`, `/entrenamientos/:id`, `/nutricion`, `/dietas/:id`, `/progreso`, `/ejercicios`, `/admin/usuarios`, `/asistente`, `/admin/roles`, `/admin/bitacora` y `/admin/integridad`. `/acerca` y `/contacto` son alias a Nosotros.

Flujo: router -> autenticación/permiso -> controlador -> servicio de dominio -> modelos Sequelize -> MySQL. La interfaz consume `/api/v1`; no accede directamente a DB, SMTP ni IA. Los servicios exponen operaciones equivalentes a las clases UML (Usuario/Cliente/PerfilFisico/Objetivo/Rutina/Dieta/Comida/RegistroEntrenamiento/Progreso/Seguridad/Administrador/IA).

## Persistencia y seguridad

Modelos del DER con UUID y extensiones documentadas en REQUISITOS.md. Migraciones explícitas; no `sync({alter:true})` en arranque. Tabla de sesiones y recuperación adicional para revocación y tokens de un solo uso. Teléfono en AES-256-GCM; contraseña con scrypt; email normalizado con índice único.

Las escrituras del dominio usan una transacción y bloqueo de integridad común. Se verifican los hashes existentes antes de modificar, se ejecuta la operación y su bitácora, se firman las filas y agregados resultantes y se confirma. Una divergencia aborta la escritura, nunca se encubre con un recálculo automático. El costo de verificación completa es aceptable para este proyecto académico; una escala mayor requerirá verificación incremental y anclaje de auditoría externo.

Los modelos sensibles nunca se serializan directamente. Respuestas seleccionan campos públicos; no devuelven password_hash, token_hash, cifrado o claves. Permisos se evalúan en servidor en cada solicitud. Protección de último administrador activo.

La IA usa un adaptador HTTPS de Cohere y salida JSON estructurada. Requiere consentimiento explícito y revocable antes de transmitir contexto. `IAService`, `Rutina.generarConIA`, `Dieta.generarConIA` y los nombres literales de las secuencias coordinan generación/adaptación. Zod valida estructura y una segunda capa limita cargas, volumen y coherencia calórica antes de persistir. El proveedor tiene timeout, un reintento transitorio y verificación real cacheada para el estado de disponibilidad. No se instala ni ejecuta ningún modelo local.

## Frontend decidido

Aplicación en español con apariencia deportiva sobria: fondo marfil/gris muy claro, texto carbón, acento verde lima y verde bosque. Barra lateral fija en escritorio y navegación móvil compacta. Tarjetas blancas con bordes sutiles, tipografía sans legible, números grandes para métricas y jerarquía clara. Evitar una pantalla genérica de tarjetas idénticas.

Dashboard: saludo, fecha, acción principal de entrenamiento, estado del objetivo, resumen de macros, gráfico de evolución y actividad reciente. Rutinas: biblioteca y editor por días con filas de ejercicios; entrenamiento activo con checklist, carga y descanso. Nutrición: resumen diario con barras de macros, timeline por comidas y editor de alimentos. Progreso: gráfico temporal y comparación inicial/actual. Asistente IA: generación/adaptación de planes y chat con historial, modos entrenador y soporte. Administración: tablas con filtros, roles/permisos, bitácora e integridad.

Cada pantalla incluye estado vacío útil, carga, reintento y confirmaciones explícitas de acciones destructivas. Los formularios conservan valores si falla la red. Tablas no desbordan en 390px; menús, modales y mensajes son operables con teclado y lectores de pantalla.

## Entorno

Node 24, MySQL 8.4 aislado en Docker; Compose para reproducción. Desarrollo local usa puerto API 3000, Vite 5173, MySQL 3307 (no interfiere con instalaciones existentes), correo local de desarrollo y Cohere por API. Entorno de pruebas con DB separada `gym_os_test`. En esta computadora se utiliza el contexto Docker `colima-gymos`, sin alterar el contexto predeterminado.
