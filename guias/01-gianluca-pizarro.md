# Gianluca Pizarro: Cuentas y acceso

Guía del **GYM-OS completo**. Reparto por funcionalidades para estudiar y revisar; no acredita autoría ni cambios que todavía no realizó cada integrante.

## Tu funcionalidad completa

La cuenta de una persona desde que se registra hasta que se va: registro, login, logout, recuperación, perfil personal y eliminación de cuenta. Login y registro son partes de una misma funcionalidad tuya; no se reparten entre nueve.

**Casos de uso:** CU001–CU006. **Pantallas:** `/, /nosotros, /registro, /login, /recuperar, /restablecer y /me`.

## Archivos que tenés que abrir

- [client/src/pages/Auth.jsx](../client/src/pages/Auth.jsx)
- [client/src/pages/Account.jsx](../client/src/pages/Account.jsx)
- [controllers/accounts.controller.js](../controllers/accounts.controller.js)
- [controllers/auth.controller.js](../controllers/auth.controller.js)
- [controllers/security.controller.js](../controllers/security.controller.js)
- [controllers/mail.controller.js](../controllers/mail.controller.js)
- [routes/accounts.routes.js](../routes/accounts.routes.js)
- [models/Usuario.model.js](../models/Usuario.model.js)
- [models/Sesion.model.js](../models/Sesion.model.js)
- [models/Recuperacion.model.js](../models/Recuperacion.model.js)

## Librerías y herramientas de tu módulo

React administra los formularios y el usuario compartido; React Router ofrece enlaces y redirecciones. Express y cookie-parser reciben solicitudes y cookies. Zod valida. Sequelize y mysql2 persisten. node:crypto usa scrypt para contraseñas, SHA-256 para tokens aleatorios y AES-256-GCM para teléfono. Nodemailer entrega recuperación por SMTP; en desarrollo puede escribir un correo privado en .local/mail.

## Funciones y componentes: qué hace cada uno

| Dónde ubicarlo                                                                                        | Qué recibe, hace y devuelve                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Landing](../client/src/pages/Auth.jsx#L16) en `client/src/pages/Auth.jsx`                            | Recibe about y muestra inicio/presentación; dirige al panel si hay sesión, o al registro/login.                                                                        |
| [Auth](../client/src/pages/Auth.jsx#L118) en `client/src/pages/Auth.jsx`                              | Recibe mode y conserva el formulario; submit elige registro, login, solicitud o restablecimiento y presenta errores.                                                   |
| [register](../controllers/accounts.controller.js#L57) en `controllers/accounts.controller.js`         | Recibe datos ya validados. Comprueba correo único, crea usuario y rol Cliente, abre sesión y audita en una transacción. Devuelve user público y token interno.         |
| [login](../controllers/accounts.controller.js#L123) en `controllers/accounts.controller.js`           | Ejecuta Usuario.iniciarSesion; verifica hash y estado, actualiza última conexión y abre sesión. Los errores no distinguen correo inexistente de contraseña incorrecta. |
| [authenticate](../controllers/accounts.controller.js#L125) en `controllers/accounts.controller.js`    | Recibe cookie. Comprueba formato, hash, vencimiento y usuario activo, bajo verificación de integridad. Devuelve únicamente usuario público.                            |
| [publicUser](../controllers/accounts.controller.js#L26) en `controllers/accounts.controller.js`       | Selecciona los campos que pueden salir; descifra teléfono y agrega roles y permisos, sin hashes ni token.                                                              |
| [loadUser](../controllers/accounts.controller.js#L24) en `controllers/accounts.controller.js`         | Carga Usuario y sus roles para que autenticación, perfil y administración usen el mismo formato.                                                                       |
| [logout](../controllers/accounts.controller.js#L155) en `controllers/accounts.controller.js`          | Ejecuta Usuario.cerrarSesion; elimina la sesión actual y deja bitácora. La ruta borra la cookie.                                                                       |
| [updateProfile](../controllers/accounts.controller.js#L168) en `controllers/accounts.controller.js`   | Ejecuta Cliente.actualizarDatos; cifra teléfono y guarda sólo los campos permitidos, incluido consentimiento de IA.                                                    |
| [requestRecovery](../controllers/accounts.controller.js#L212) en `controllers/accounts.controller.js` | Genera token temporal y persiste su hash para cuentas activas; devuelve mensaje uniforme. Envía el correo o registra fallo de envío.                                   |
| [resetPassword](../controllers/accounts.controller.js#L240) en `controllers/accounts.controller.js`   | Valida token no usado y no vencido, cambia hash, marca token usado y revoca sesiones. La operación es transaccional.                                                   |
| [deleteAccount](../controllers/accounts.controller.js#L319) en `controllers/accounts.controller.js`   | Exige contraseña actual y vuelve a comprobar la cuenta antes de llamar deleteUserData.                                                                                 |
| [deleteUserData](../controllers/accounts.controller.js#L262) en `controllers/accounts.controller.js`  | Borra relaciones y datos personales/deportivos en orden compatible con claves foráneas; anonimiza la referencia en bitácora y protege al último administrador.         |
| [hashPassword](../controllers/security.controller.js#L21) en `controllers/security.controller.js`     | Genera sal y hash scrypt; no es cifrado reversible. verifyPassword recalcula y compara de forma resistente a diferencias de tiempo.                                    |
| [encrypt](../controllers/security.controller.js#L42) en `controllers/security.controller.js`          | Cifra teléfono con autenticación; decrypt recupera el dato con la clave privada, no con un secreto del navegador.                                                      |
| [sendRecovery](../controllers/mail.controller.js#L8) en `controllers/mail.controller.js`              | Construye enlace con token de un solo uso y entrega el correo. En modo file escribe localmente; no demuestra entrega SMTP real.                                        |

Los enlaces señalan el inicio de la función en la versión revisada. Estudiá su responsabilidad y su llamada anterior/siguiente; no hace falta memorizar cada instrucción. Los sufijos Impl contienen la implementación delegada por los métodos literales UML.

## Datos que guarda y consulta

usuarios identifica a la persona, conserva hash, teléfono cifrado, zona horaria y consentimiento. sesiones contiene usuario, hash de token y vencimiento. recuperaciones contiene hash, vencimiento y usado. usuario_roles vincula la cuenta con roles.

## Endpoints para defenderlo

Todas estas rutas usan el prefijo `/api/v1`. Las mutaciones del navegador envían `X-GymOS-Client: web` y el origen configurado; las privadas requieren cookie válida.

| Método           | Ruta                    | Resultado o condición                       |
| ---------------- | ----------------------- | ------------------------------------------- |
| POST             | `/auth/register`        | 201 y sesión abierta                        |
| POST             | `/auth/login`           | 200 y cookie; 401 si no habilitado          |
| POST             | `/auth/logout`          | confirmar:true; 204                         |
| POST             | `/auth/forgot-password` | Mensaje uniforme                            |
| POST             | `/auth/reset-password`  | Token y contraseña nueva                    |
| GET/PATCH/DELETE | `/me`                   | Consultar, modificar o borrar cuenta propia |

## Recorrido que tenés que explicar sin leer

El formulario reúne datos -> api envía JSON -> Zod valida -> el controlador ejecuta una transacción con integridad -> Sequelize guarda -> la ruta fija cookie HttpOnly -> AuthProvider actualiza user -> React cambia de pantalla. En el proyecto completo el registro SÍ inicia sesión: no confundirlo con la entrega parcial.

## Reglas y errores que no podés omitir

- No guardar claves, contraseñas o cookies en localStorage. La cookie es gestionada por el navegador, no leída por React.
- Un token de recuperación no se usa dos veces; cambiar contraseña revoca sesiones.
- Eliminar cuenta es irreversible y exige confirmación y contraseña. La bitácora se conserva sin referencia personal.
- El correo local de desarrollo no significa que se haya enviado un correo real.

Los errores de validación usan 400; falta de sesión 401; permiso/consentimiento 403; registro ajeno o ausente 404; conflicto de estado 409; límite de intentos 429; dependencia o integridad no disponible 503. No todo tu módulo produce todos estos códigos: identificá los de cada recorrido.

## Demostración con datos ficticios

1. Crear una cuenta ficticia y mostrar que entra al panel.
2. Salir e ingresar con contraseña errónea; luego con la correcta.
3. Editar nombre/teléfono y recargar para comprobar persistencia.
4. Solicitar recuperación y explicar el correo local sin exponer el token en público.
5. Explicar el borrado sin ejecutar la eliminación de una cuenta real.

## Preguntas con respuesta

**¿Qué cambia entre registrar e iniciar sesión?** Registro crea cuenta y rol; login valida una existente. Ambos abren sesión en esta aplicación completa.

**¿Qué diferencia tiene hash frente a cifrado?** La contraseña se verifica con scrypt sin recuperarla; el teléfono se descifra con una clave privada.

**¿La vista privada es suficiente para proteger datos?** No. requireAuth y los controladores verifican sesión y permisos en el servidor.

## Límite con los otros integrantes

Simón administra cuentas de terceros y roles; vos manejás la cuenta propia. Gade gestiona medidas corporales; no son campos del perfil personal. Tomás consume el consentimiento que se cambia en tu pantalla.

## Preparación para exponer

Podés presentar tu bloque así: «Mi funcionalidad es cuentas y acceso. Voy a mostrar qué puede hacer el usuario, seguir una operación desde el formulario hasta MySQL y explicar qué ocurre si los datos o permisos no son válidos». Adaptalo a lo que realmente revisaste.

Estás preparado cuando podés demostrar el recorrido feliz, un rechazo, una cancelación donde exista y la persistencia después de recargar. Si falla un proveedor externo, explicá la alternativa real y no inventes una respuesta exitosa.

Antes de exponer, leé el [recorrido común](README.md) y el [informe de revisión](../docs/REVISION-FINAL.md). Anotá las comprobaciones y cambios reales en [REPARTO.md](../REPARTO.md).
