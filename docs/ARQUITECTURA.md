# Arquitectura y dirección de interfaz

## Organización

El backend sigue la estructura entregada en `REPASO COMPLETO.rar`: `index.js` en la raíz y las carpetas `config/`, `controllers/`, `models/` y `routes/`. `client/` contiene React y Vite; `shared/` contiene validaciones y constantes usadas por frontend y backend. `docs/` y `scripts/` completan la entrega sin introducir otra capa de backend.

La estructura del repaso se utiliza como patrón MVC, mientras que sus usuarios, hobbies, PostgreSQL y `sync({force:true})` son ejemplos del ejercicio y no requisitos de GYM-OS. La implementación conserva MySQL, las migraciones seguras y el dominio definido por UML y secuencias. La navegación incluye Inicio `/`, Dashboard `/dashboard`, Nosotros `/nosotros`, Mi perfil `/me`, `/objetivos`, `/rutinas`, `/rutinas/:id`, `/entrenamientos/:id`, `/nutricion`, `/dietas/:id`, `/progreso`, `/ejercicios`, `/admin/usuarios`, `/asistente`, `/admin/roles`, `/admin/bitacora` y `/admin/integridad`. `/acerca` y `/contacto` son alias a Nosotros.

Flujo: `routes` -> autenticación/permiso -> `controllers` -> `models` Sequelize -> MySQL. La interfaz consume `/api/v1`; no accede directamente a DB, SMTP ni IA. Los controladores ejecutan las operaciones equivalentes a las clases UML (Usuario/Cliente/PerfilFisico/Objetivo/Rutina/Dieta/Comida/RegistroEntrenamiento/Progreso/Seguridad/Administrador/IA).

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

Node 24, MySQL 8.4 aislado en Docker; Compose para reproducción. Desarrollo local usa puerto API 3000, Vite 5173, MySQL 3307 (no interfiere con instalaciones existentes), correo local de desarrollo y Cohere por API. En esta computadora se utiliza el contexto Docker `colima-gymos`, sin alterar el contexto predeterminado.
