# Simón Castellani: Administración del sistema

Guía del **GYM-OS completo**. Reparto por funcionalidades para estudiar y revisar; no acredita autoría ni cambios que todavía no realizó cada integrante.

## Tu funcionalidad completa

El panel administrativo completo: buscar usuarios, bloquear/activar/eliminar, crear/modificar/asignar/borrar roles y consultar bitácora e integridad. Seguridad y firmas se estudian en cuanto permiten operar y proteger estas funciones, no como una novena microtarea artificial.

**Casos de uso:** CU032–CU039; bitácora e integridad transversales. **Pantallas:** `/admin/usuarios, /admin/roles, /admin/bitacora y /admin/integridad`.

## Archivos que tenés que abrir

- [client/src/pages/Admin.jsx](../client/src/pages/Admin.jsx)
- [controllers/admin.controller.js](../controllers/admin.controller.js)
- [controllers/integrity.controller.js](../controllers/integrity.controller.js)
- [controllers/accounts.controller.js](../controllers/accounts.controller.js)
- [routes/admin.routes.js](../routes/admin.routes.js)
- [models/Rol.model.js](../models/Rol.model.js)
- [models/UsuarioRol.model.js](../models/UsuarioRol.model.js)
- [models/Bitacora.model.js](../models/Bitacora.model.js)
- [models/Integrity.model.js](../models/Integrity.model.js)
- [shared/constants.js](../shared/constants.js)

## Librerías y herramientas de tu módulo

React administra tablas/filtros y confirmaciones; React Router separa las páginas del panel. Zod valida permisos y confirmaciones. Sequelize usa relaciones y transacciones. HMAC-SHA256 con clave privada comprueba firmas; no es una suma que se recalcula ciegamente al detectar cambios.

## Funciones y componentes: qué hace cada uno

| Dónde ubicarlo                                                                                           | Qué recibe, hace y devuelve                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [AdminHeader](../client/src/pages/Admin.jsx#L28) en `client/src/pages/Admin.jsx`                         | Muestra pestañas según permisos efectivos del usuario conectado.                                                                |
| [AdminUsers](../client/src/pages/Admin.jsx#L54) en `client/src/pages/Admin.jsx`                          | Busca, filtra y pagina cuentas; abre asignación de roles y confirmación de estado/borrado.                                      |
| [AssignRoles](../client/src/pages/Admin.jsx#L223) en `client/src/pages/Admin.jsx`                        | Envía reemplazo completo de roles seleccionados con confirmar:true; no agrega permisos localmente.                              |
| [RoleForm](../client/src/pages/Admin.jsx#L280) en `client/src/pages/Admin.jsx`                           | Edita nombre, descripción y conjunto de permisos; llama POST o PUT según exista el rol.                                         |
| [AdminRoles](../client/src/pages/Admin.jsx#L349) en `client/src/pages/Admin.jsx`                         | Lista y protege roles del sistema; permite operar roles personalizados.                                                         |
| [AdminAudit](../client/src/pages/Admin.jsx#L434) en `client/src/pages/Admin.jsx`                         | Consulta eventos por módulo/resultado y página, sin botón de edición de bitácora.                                               |
| [AdminIntegrity](../client/src/pages/Admin.jsx#L521) en `client/src/pages/Admin.jsx`                     | Muestra filas/firmas y vuelve a verificar; no repara ni firma alteraciones automáticamente.                                     |
| [authorizeActor](../controllers/admin.controller.js#L8) en `controllers/admin.controller.js`             | Vuelve a cargar usuario activo y sus permisos dentro de la operación; no confía sólo en que la vista muestre un botón.          |
| [listUsers](../controllers/admin.controller.js#L19) en `controllers/admin.controller.js`                 | Busca y pagina con roles, excluyendo teléfono y nacimiento del listado administrativo.                                          |
| [listRoles](../controllers/admin.controller.js#L46) en `controllers/admin.controller.js`                 | Devuelve roles sin firma interna.                                                                                               |
| [saveRole](../controllers/admin.controller.js#L89) en `controllers/admin.controller.js`                  | Ejecuta crearRoles/modificarRoles, rechaza nombre repetido y modificación de rol del sistema.                                   |
| [assignRoles](../controllers/admin.controller.js#L130) en `controllers/admin.controller.js`              | Ejecuta asignarRoles; valida todos los IDs, protege último administrador, reemplaza relaciones y revoca sesiones del afectado.  |
| [deleteRole](../controllers/admin.controller.js#L109) en `controllers/admin.controller.js`               | Sólo elimina un rol personalizado sin usuarios asignados.                                                                       |
| [changeStatus](../controllers/admin.controller.js#L149) en `controllers/admin.controller.js`             | Ejecuta activarUsuario/bloquearUsuario y revoca sesiones; protege al último administrador.                                      |
| [removeUser](../controllers/admin.controller.js#L167) en `controllers/admin.controller.js`               | Exige permiso y existencia; usa deleteUserData para borrar datos en orden seguro.                                               |
| [listAudit](../controllers/admin.controller.js#L169) en `controllers/admin.controller.js`                | Devuelve eventos paginados según filtros autorizados.                                                                           |
| [integrityReport](../controllers/admin.controller.js#L186) en `controllers/admin.controller.js`          | Permite inspeccionar todas las firmas si las tablas de autenticación siguen válidas.                                            |
| [assertAdminRemains](../controllers/accounts.controller.js#L242) en `controllers/accounts.controller.js` | Impide bloquear, eliminar o quitar el rol al último administrador activo.                                                       |
| [inspectIntegrity](../controllers/integrity.controller.js#L23) en `controllers/integrity.controller.js`  | Compara firma HMAC de cada fila y agregado de tabla; informa divergencias sin cambiar datos.                                    |
| [atomic](../controllers/integrity.controller.js#L59) en `controllers/integrity.controller.js`            | Bloquea mutex para escritura, verifica antes, ejecuta operación, firma el resultado legítimo y confirma; un fallo revierte.     |
| [verified](../controllers/integrity.controller.js#L81) en `controllers/integrity.controller.js`          | Usa bloqueo compartido para lecturas coherentes y comprueba las tablas relevantes.                                              |
| [signDatabase](../controllers/integrity.controller.js#L41) en `controllers/integrity.controller.js`      | Firma filas y agregados sólo dentro de flujos autorizados de escritura/migración; no debe usarse para encubrir datos alterados. |
| [audit](../controllers/integrity.controller.js#L100) en `controllers/integrity.controller.js`            | Agrega fecha, actor, acción, módulo y resultado al registro de eventos.                                                         |

Los enlaces señalan el inicio de la función en la versión revisada. Estudiá su responsabilidad y su llamada anterior/siguiente; no hace falta memorizar cada instrucción. Los sufijos Impl contienen la implementación delegada por los métodos literales UML.

## Datos que guarda y consulta

roles contiene permisos JSON y marca sistema. usuario_roles expresa muchos a muchos. bitacora guarda eventos; borrar cuenta anonimiza usuario_id y preserva trazabilidad. digitos_verificadores contiene DVV por tabla y fila **mutex**. DVH vive en cada entidad protegida.

## Endpoints para defenderlo

Todas estas rutas usan el prefijo `/api/v1`. Las mutaciones del navegador envían `X-GymOS-Client: web` y el origen configurado; las privadas requieren cookie válida.

| Método              | Ruta                              | Resultado o condición         |
| ------------------- | --------------------------------- | ----------------------------- |
| GET                 | `/admin/users`                    | Búsqueda/paginación           |
| GET/POST/PUT/DELETE | `/admin/roles y /admin/roles/:id` | Gestión de roles con permisos |
| PUT                 | `/admin/users/:id/roles`          | Reemplazo confirmado          |
| PATCH               | `/admin/users/:id/status`         | Bloquear/activar confirmado   |
| DELETE              | `/admin/users/:id`                | Eliminar usuario confirmado   |
| GET                 | `/admin/audit y /admin/integrity` | Consultas administrativas     |

## Recorrido que tenés que explicar sin leer

Administrador autenticado -> ruta verifica permiso -> controlador revalida actor dentro de la operación -> comprueba restricciones -> cambia cuenta/rol y revoca sesiones si corresponde -> registra evento y actualiza firmas -> panel vuelve a cargar. Cancelar el diálogo no manda la mutación.

## Reglas y errores que no podés omitir

- Cliente no puede abrir endpoints administrativos aunque escriba la URL o fabrique JSON.
- Administrador/Cliente del sistema están protegidos; para cambios se crea rol personalizado.
- No se elimina un rol con asignados y siempre queda un administrador activo.
- Las firmas completas implican costo creciente y un mutex global: apropiado para la entrega académica, no evidencia de escala productiva.

Los errores de validación usan 400; falta de sesión 401; permiso/consentimiento 403; registro ajeno o ausente 404; conflicto de estado 409; límite de intentos 429; dependencia o integridad no disponible 503. No todo tu módulo produce todos estos códigos: identificá los de cada recorrido.

## Demostración con datos ficticios

1. Ingresar con cuenta administrativa ficticia y filtrar usuarios.
2. Crear rol personalizado y mostrar rechazo de duplicado.
3. Asignarlo a otro usuario y explicar por qué pierde sesiones anteriores.
4. Bloquear/activar con confirmación y comprobar rechazo/aceptación del login.
5. Consultar evento e integridad; mostrar protección del último administrador sin modificar datos reales.

## Preguntas con respuesta

**¿Ocultar un botón evita abuso?** No; permisos y estado se comprueban en servidor y dentro de la transacción.

**¿Qué diferencia hay entre DVH y DVV?** DVH firma contenido de una fila; DVV agrega identidades y firmas ordenadas de una tabla.

**¿La pantalla de integridad repara?** No. Detecta y reporta; recalcular sin investigar ocultaría la alteración.

## Límite con los otros integrantes

Gianluca gestiona la cuenta propia y el borrado común. Vos gestionás terceros y roles. Los otros ocho módulos generan eventos y usan la misma integridad; no tienen que estudiar tu panel completo para defender su funcionalidad.

## Preparación para exponer

Podés presentar tu bloque así: «Mi funcionalidad es administración del sistema. Voy a mostrar qué puede hacer el usuario, seguir una operación desde el formulario hasta MySQL y explicar qué ocurre si los datos o permisos no son válidos». Adaptalo a lo que realmente revisaste.

Estás preparado cuando podés demostrar el recorrido feliz, un rechazo, una cancelación donde exista y la persistencia después de recargar. Si falla un proveedor externo, explicá la alternativa real y no inventes una respuesta exitosa.

Antes de exponer, leé el [recorrido común](README.md) y el [informe de revisión](../docs/REVISION-FINAL.md). Anotá las comprobaciones y cambios reales en [REPARTO.md](../REPARTO.md).
