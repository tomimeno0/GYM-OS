# Guías del GYM-OS completo

Un documento por persona y una funcionalidad completa por documento. Estas guías reemplazan el reparto reducido de autenticación para la defensa del sistema final. No modifican ni borran la entrega parcial guardada en .local/Proyecto-Gym-OS.

| Integrante         | Funcionalidad                            | Guía                              |
| ------------------ | ---------------------------------------- | --------------------------------- |
| Gianluca Pizarro   | Cuentas y acceso                         | [Abrir](01-gianluca-pizarro.md)   |
| Joaquín Casanou    | Rutinas y catálogo de ejercicios         | [Abrir](08-joaquin-casanou.md)    |
| Iván Lerner        | Entrenamientos e historial de sesiones   | [Abrir](03-ivan-lerner.md)        |
| Paulo López        | Objetivos personales                     | [Abrir](04-paulo-lopez.md)        |
| Gade Silva y Lápiz | Perfil físico, progreso y panel          | [Abrir](05-gade-silva-y-lapiz.md) |
| Valentín Schueld   | Dietas y planificación alimentaria       | [Abrir](06-valentin-schueld.md)   |
| Mateo Romani       | Registro alimentario, alimentos y macros | [Abrir](07-mateo-romani.md)       |
| Tomás Menossi      | Asistente de IA y planes generados       | [Abrir](02-tomas-menossi.md)      |
| Simón Castellani   | Administración del sistema               | [Abrir](09-simon-castellani.md)   |

## Qué deben entender todos

El lenguaje de frontend y backend es JavaScript. React dibuja pantallas y administra estado; React Router elige la vista. Express recibe HTTP, las rutas verifican sesión/permisos y los controladores aplican reglas. Sequelize representa entidades y genera SQL; mysql2 conecta con MySQL 8.4. Zod valida entradas. Las claves privadas no se entregan al navegador.

```text
Usuario opera una pantalla React
    -> client/src/lib.jsx: api(ruta, cuerpo, método)
    -> index.js: JSON, cookie, control de origen y rutas /api/v1
    -> routes/: esquema Zod, requireAuth y permit
    -> controllers/: reglas de la funcionalidad
    -> models/ y Sequelize -> MySQL
    -> respuesta pública -> estado React -> pantalla actualizada
```

No confundir ruta de pantalla (/rutinas) con endpoint (/api/v1/routines). Tampoco guardar estado en React equivale a persistir: los datos sobreviven a la recarga cuando se guardaron correctamente en MySQL.

## Soporte compartido que no es una décima funcionalidad

| Archivo o función                                                 | Qué deben saber, sin memorizar su implementación                                                                                          |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [index.js](../index.js)                                           | Monta middleware y routers, sirve client/dist y traduce errores en respuestas seguras.                                                    |
| [config/db.js](../config/db.js)                                   | Mantiene conexión y pool de Sequelize a MySQL.                                                                                            |
| [config/schema.js](../config/schema.js)                           | Define tablas, columnas, relaciones e índices. Las migraciones las preparan; arrancar no borra datos.                                     |
| [lib.jsx](../client/src/lib.jsx)                                  | api envía JSON/cookies y traduce errores; useResource carga y recarga; useAction evita envíos repetidos; AuthProvider comparte la sesión. |
| [ui.jsx](../client/src/components/ui.jsx)                         | Resource ofrece carga/error/vacío; Field vincula etiqueta/input; Modal y Confirm permiten aceptar o cancelar.                             |
| [domain.controller.js](../controllers/domain.controller.js)       | owned limita al propietario; readFitness/writeFitness autorizan operaciones; dto elimina campos internos.                                 |
| [integrity.controller.js](../controllers/integrity.controller.js) | atomic verifica y firma escrituras dentro de transacción; verified permite lecturas coherentes; audit registra el evento.                 |
| [uml.model.js](../models/uml.model.js)                            | Conserva nombres de métodos del UML/secuencias y delega operaciones; no son las mismas clases que los modelos Sequelize.                  |
| [shared/schemas.js](../shared/schemas.js)                         | Contratos estrictos de datos. La validación HTML ayuda, pero el servidor debe volver a validar.                                           |

En el UML hay nombres literales como definirObjeto, visuaizarObjetivo y encriptarRreversible. No corregirlos al exponer como si el código tuviera otros nombres. Cada guía explica cuáles ejecuta su módulo.

## Cómo estudiar

1. Ubicá las pantallas de tu funcionalidad y probá el recorrido.
2. Abrí los archivos y enlaces a funciones de tu guía. Entendé entrada, salida y datos afectados.
3. Seguí una acción concreta desde el botón hasta la fila SQL y la respuesta; no recites sintaxis.
4. Mostrá un rechazo y una cancelación, además del caso exitoso.
5. Recargá y verificá que los cambios guardados siguen presentes.
6. Explicá qué te entrega otro módulo y qué le devolvés, sin apropiarte de su trabajo.

## Preparar la demostración

Seguir [README](../README.md) y [OPERACION](../docs/OPERACION.md). Desarrollo original: interfaz http://localhost:5173, API 3000 y MySQL 3307. La instancia de auditoría usa puertos separados y datos desechables; no es la configuración de entrega. No abrir ni proyectar .env con secretos.

Registro del proyecto completo abre sesión automáticamente. Las cuentas demo sólo existen si se crearon con seed --demo; la contraseña está en entorno privado, no en esta guía. El correo de recuperación local no es un correo real. El modo AI_MOCK simula el proveedor y no prueba Cohere real. La información nutricional y los planes no reemplazan asesoramiento profesional.

No existe gestión independiente de recetas ni infraestructura de alojamiento productivo entregada. La revisión funcional y sus límites figuran en [REVISION-FINAL](../docs/REVISION-FINAL.md). Las guías describen lo implementado; no certifican que alguien lo haya estudiado o desarrollado sin asistencia.
