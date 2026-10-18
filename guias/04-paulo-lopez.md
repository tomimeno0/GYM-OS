# Paulo López: Objetivos personales

Guía del **GYM-OS completo**. Reparto por funcionalidades para estudiar y revisar; no acredita autoría ni cambios que todavía no realizó cada integrante.

## Tu funcionalidad completa

Definir la meta de una persona, validar que tenga sentido para su perfil, mostrar su avance y completar/eliminarla con confirmación. Te corresponde la funcionalidad entera, desde el formulario hasta las reglas de un único objetivo activo.

**Casos de uso:** CU009–CU013. **Pantallas:** `/objetivos; consulta del avance también en panel y progreso`.

## Archivos que tenés que abrir

- [client/src/pages/Fitness.jsx](../client/src/pages/Fitness.jsx)
- [controllers/fitness.controller.js](../controllers/fitness.controller.js)
- [models/Objetivo.model.js](../models/Objetivo.model.js)
- [shared/constants.js](../shared/constants.js)
- [shared/schemas.js](../shared/schemas.js)
- [routes/fitness.routes.js](../routes/fitness.routes.js)

## Librerías y herramientas de tu módulo

React implementa el formulario y las confirmaciones; Zod valida forma/tipos y Luxon calcula fechas según la zona del usuario. Sequelize consulta la medición inicial y actividad previa. GOAL_TYPES y GOAL_LABELS mantienen los tipos y nombres visibles.

## Funciones y componentes: qué hace cada uno

| Dónde ubicarlo                                                                                         | Qué recibe, hace y devuelve                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [GoalForm](../client/src/pages/Fitness.jsx#L534) en `client/src/pages/Fitness.jsx`                     | Mantiene la meta, deriva la unidad según el tipo, convierte números y envía POST. Cancelar no guarda.                                                               |
| [Goals](../client/src/pages/Fitness.jsx#L631) en `client/src/pages/Fitness.jsx`                        | Carga progreso y muestra objetivos con acciones de completar/eliminar. Abre diálogos y vuelve a consultar después del cambio.                                       |
| [activeGoal](../controllers/fitness.controller.js#L34) en `controllers/fitness.controller.js`          | Busca el objetivo activo del usuario dentro de la transacción.                                                                                                      |
| [validateGoalLink](../controllers/fitness.controller.js#L37) en `controllers/fitness.controller.js`    | Comprueba propietario y vigencia para un nuevo vínculo desde rutina/dieta.                                                                                          |
| [listGoals](../controllers/fitness.controller.js#L119) en `controllers/fitness.controller.js`          | Ejecuta Objetivo.visuaizarObjetivo y devuelve objetivos no eliminados.                                                                                              |
| [validateGoalValues](../controllers/fitness.controller.js#L121) en `controllers/fitness.controller.js` | Verifica unidad compatible, rango y dirección: bajar peso debe ser menor; ganar peso mayor; definir requiere grasa inicial; frecuencia debe ser entera hasta siete. |
| [createGoal](../controllers/fitness.controller.js#L242) en `controllers/fitness.controller.js`         | Ejecuta Objetivo.definirObjeto. Exige perfil previo y un solo activo; fija medición y valor inicial. Para km/frecuencia considera actividad previa.                 |
| [completeGoal](../controllers/fitness.controller.js#L253) en `controllers/fitness.controller.js`       | Ejecuta Objetivo.marcarCompletado. Exige objetivo propio activo, marca fecha y libera la clave de objetivo activo.                                                  |
| [removeGoal](../controllers/fitness.controller.js#L261) en `controllers/fitness.controller.js`         | Ejecuta Objetivo.eliminarObjetivo; realiza baja lógica y libera objetivo activo.                                                                                    |
| [goalPercentage](../controllers/fitness.controller.js#L268) en `controllers/fitness.controller.js`     | Ejecuta Progreso.calcularPorcentaje: calcula avance relativo a inicial/meta, limitado entre 0 y 100. Si falta información devuelve null.                            |
| [progressData](../controllers/fitness.controller.js#L270) en `controllers/fitness.controller.js`       | En tu bloque, estudiar la sección goalProgress: elige peso, grasa, distancia o días según unidad y limita el período para objetivos completados.                    |

Los enlaces señalan el inicio de la función en la versión revisada. Estudiá su responsabilidad y su llamada anterior/siguiente; no hace falta memorizar cada instrucción. Los sufijos Impl contienen la implementación delegada por los métodos literales UML.

## Datos que guarda y consulta

objetivos guarda tipo, valor_objetivo, unidad, fechas, frecuencia_semanal, valor_inicial, peso_inicial y medicion_inicio_id. usuario_activo único impide dos objetivos activos y queda null al completar/eliminar. No hay edición arbitraria de metas existentes en esta entrega.

## Endpoints para defenderlo

Todas estas rutas usan el prefijo `/api/v1`. Las mutaciones del navegador envían `X-GymOS-Client: web` y el origen configurado; las privadas requieren cookie válida.

| Método   | Ruta                  | Resultado o condición                              |
| -------- | --------------------- | -------------------------------------------------- |
| GET/POST | `/goals`              | Listar y definir                                   |
| POST     | `/goals/:id/complete` | Confirmación para marcar completado                |
| DELETE   | `/goals/:id`          | Baja lógica confirmada                             |
| GET      | `/progress`           | Incluye valor_actual y porcentaje de cada objetivo |

## Recorrido que tenés que explicar sin leer

El usuario ya tiene medición -> define tipo, meta y fechas -> el servidor verifica unidad y dirección -> captura un valor inicial -> al consultar progreso elige la métrica adecuada -> el usuario puede declarar completado -> se conserva en el historial y permite definir otro.

## Reglas y errores que no podés omitir

- No todo objetivo usa kg: resistencia usa km, definición porcentaje y constancia días por semana.
- Marcar completado es una declaración del usuario, no una certificación médica ni un cambio automático al llegar a 100%.
- El porcentaje se satura en 0–100; la cifra inicial queda guardada aunque se registren medidas nuevas.
- No se eliminan planes o entrenamientos por completar la meta. Se preservan vínculos históricos.

Los errores de validación usan 400; falta de sesión 401; permiso/consentimiento 403; registro ajeno o ausente 404; conflicto de estado 409; límite de intentos 429; dependencia o integridad no disponible 503. No todo tu módulo produce todos estos códigos: identificá los de cada recorrido.

## Demostración con datos ficticios

1. Intentar crear objetivo sin medición y explicar el rechazo.
2. Crear una meta compatible y mostrar que una segunda activa no se admite.
3. Consultar el valor inicial y la unidad.
4. Cancelar una confirmación sin cambios; luego completar.
5. Crear una nueva meta y mostrar que la anterior sigue en historial.

## Preguntas con respuesta

**¿Qué evita dos objetivos simultáneos?** Validación transaccional y clave usuario_activo única en MySQL.

**¿Cero por ciento es lo mismo que null?** No. Cero es avance medido; null indica falta de información para calcularlo.

**¿Qué hace definirObjeto con ese nombre?** Conserva el nombre literal del UML y ejecuta la creación; no se renombró por estética.

## Límite con los otros integrantes

Gade registra medidas y muestra la evolución general. Vos definís la meta y sus reglas; Tomás y Valentín la asocian a planes. Iván aporta actividad real para metas de distancia o frecuencia.

## Preparación para exponer

Podés presentar tu bloque así: «Mi funcionalidad es objetivos personales. Voy a mostrar qué puede hacer el usuario, seguir una operación desde el formulario hasta MySQL y explicar qué ocurre si los datos o permisos no son válidos». Adaptalo a lo que realmente revisaste.

Estás preparado cuando podés demostrar el recorrido feliz, un rechazo, una cancelación donde exista y la persistencia después de recargar. Si falla un proveedor externo, explicá la alternativa real y no inventes una respuesta exitosa.

Antes de exponer, leé el [recorrido común](README.md) y el [informe de revisión](../docs/REVISION-FINAL.md). Anotá las comprobaciones y cambios reales en [REPARTO.md](../REPARTO.md).
