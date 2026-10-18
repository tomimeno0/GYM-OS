# Tomás Minossi: Rutinas y catálogo de ejercicios

Guía del **GYM-OS completo**. Reparto por funcionalidades para estudiar y revisar; no acredita autoría ni cambios que todavía no realizó cada integrante.

## Tu funcionalidad completa

Un plan de entrenamiento completo: buscar ejercicios, organizar días, definir series/repeticiones/carga/descanso, consultar, modificar y dar de baja rutinas. Sos responsable de esta experiencia entera, no sólo de una tabla.

**Casos de uso:** CU014, CU016–CU018 y CU020; generación IA coordinada con Joaquín. **Pantallas:** `/rutinas, /rutinas/nueva, /rutinas/:id, /rutinas/:id/editar y /ejercicios`.

## Archivos que tenés que abrir

- [client/src/pages/Routines.jsx](../client/src/pages/Routines.jsx)
- [controllers/routines.controller.js](../controllers/routines.controller.js)
- [controllers/catalog.controller.js](../controllers/catalog.controller.js)
- [models/Rutina.model.js](../models/Rutina.model.js)
- [models/RutinaEjercicio.model.js](../models/RutinaEjercicio.model.js)
- [routes/fitness.routes.js](../routes/fitness.routes.js)
- [models/exercises/provenance.json](../models/exercises/provenance.json)
- [shared/schemas.js](../shared/schemas.js)

## Librerías y herramientas de tu módulo

React conserva el editor por días; React Router abre y navega al detalle. Zod define routineSchema/exerciseSchema. Sequelize persiste cabecera y ejercicios en una transacción. node:fs carga el catálogo y node:crypto verifica su SHA-256. lucide-react dibuja los íconos.

## Funciones y componentes: qué hace cada uno

| Dónde ubicarlo                                                                                          | Qué recibe, hace y devuelve                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RoutineList](../client/src/pages/Routines.jsx#L192) en `client/src/pages/Routines.jsx`                 | Carga y muestra planes con acceso a crear, abrir y generar con IA.                                                                                                                       |
| [ExerciseCatalog](../client/src/pages/Routines.jsx#L42) en `client/src/pages/Routines.jsx`              | Gestiona búsqueda, filtros, paginación y detalle; cuando recibe onSelect funciona también como selector del editor.                                                                      |
| [RoutineEditor](../client/src/pages/Routines.jsx#L247) en `client/src/pages/Routines.jsx`               | Lee id de la URL y carga rutina existente o formulario nuevo.                                                                                                                            |
| [RoutineForm](../client/src/pages/Routines.jsx#L256) en `client/src/pages/Routines.jsx`                 | Mantiene nombre, objetivo y ejercicios. update cambia un campo; add agrega un ejercicio; move cambia el orden visual. Al enviar renumera orden y llama POST/PUT.                         |
| [RoutineDetail](../client/src/pages/Routines.jsx#L507) en `client/src/pages/Routines.jsx`               | Muestra el plan por día, permite editar/eliminar y comienza un entrenamiento para el día elegido.                                                                                        |
| [routineDetail](../controllers/routines.controller.js#L16) en `controllers/routines.controller.js`      | Busca sólo la rutina del propietario, excluye eliminadas y carga ejercicios ordenados; devuelve ambos sin campos internos.                                                               |
| [listRoutines](../controllers/routines.controller.js#L30) en `controllers/routines.controller.js`       | Lista las rutinas visibles del usuario e incluye el detalle de ejercicios.                                                                                                               |
| [getRoutine](../controllers/routines.controller.js#L41) en `controllers/routines.controller.js`         | Envuelve la consulta de un plan propio con autorización e integridad.                                                                                                                    |
| [normalizeExercises](../controllers/routines.controller.js#L43) en `controllers/routines.controller.js` | Rechaza órdenes repetidos dentro del día. Si hay ID de catálogo, toma nombre/grupo reales del catálogo, no los confía al cliente.                                                        |
| [persistRoutine](../controllers/routines.controller.js#L59) en `controllers/routines.controller.js`     | Crea/actualiza cabecera y reemplaza ejercicios dentro de la transacción. Al editar conserva un objetivo histórico sin exigir que siga activo; si se cambia de objetivo, valida el nuevo. |
| [saveRoutine](../controllers/routines.controller.js#L117) en `controllers/routines.controller.js`       | Ejecuta Rutina.actualizarRutina; elige crear o modificar y registra el caso de uso.                                                                                                      |
| [saveAiRoutine](../controllers/routines.controller.js#L119) en `controllers/routines.controller.js`     | Reutiliza la persistencia con origen ia. El proveedor y validación IA corresponden a Joaquín.                                                                                            |
| [removeRoutine](../controllers/routines.controller.js#L138) en `controllers/routines.controller.js`     | Baja lógica: impide borrar con entrenamiento iniciado y conserva el historial.                                                                                                           |
| [searchExercises](../controllers/catalog.controller.js#L56) en `controllers/catalog.controller.js`      | Filtra catálogo textual por términos normalizados, grupo y equipo, y devuelve una página y opciones de filtro.                                                                           |
| [getExercise](../controllers/catalog.controller.js#L51) en `controllers/catalog.controller.js`          | Busca un ID válido en el mapa del catálogo; si no existe lanza EXERCISE_NOT_FOUND.                                                                                                       |

Los enlaces señalan el inicio de la función en la versión revisada. Estudiá su responsabilidad y su llamada anterior/siguiente; no hace falta memorizar cada instrucción. Los sufijos Impl contienen la implementación delegada por los métodos literales UML.

## Datos que guarda y consulta

rutinas guarda propietario, objetivo opcional, nombre, estado, origen manual/ia y fechas. rutina_ejercicios guarda día, orden, referencia de catálogo opcional y prescripción. El catálogo de 1.324 ejercicios es JSON de lectura, no una lista editable de cuentas.

## Endpoints para defenderlo

Todas estas rutas usan el prefijo `/api/v1`. Las mutaciones del navegador envían `X-GymOS-Client: web` y el origen configurado; las privadas requieren cookie válida.

| Método         | Ruta             | Resultado o condición                         |
| -------------- | ---------------- | --------------------------------------------- |
| GET/POST       | `/routines`      | Listar y crear                                |
| GET/PUT/DELETE | `/routines/:id`  | Detalle, reemplazo validado y baja confirmada |
| GET            | `/exercises`     | Búsqueda y filtros                            |
| GET            | `/exercises/:id` | Ficha de ejercicio                            |

## Recorrido que tenés que explicar sin leer

El usuario busca o escribe ejercicios -> el editor agrupa por día y mantiene estado -> al guardar envía nombre/objetivo/ejercicios -> la API valida límites, pertenencia y orden -> guarda cabecera y detalle juntos -> vuelve al detalle. Al comenzar, el módulo de Iván copia la prescripción a una sesión independiente.

## Reglas y errores que no podés omitir

- Una referencia de catálogo desconocida se rechaza; un ejercicio manual puede no tener ID.
- Editar una rutina no reescribe las series de sesiones antiguas.
- Una rutina cuyo objetivo se completó puede seguir editándose conservando ese vínculo. Un plan nuevo no se asocia a un objetivo inactivo.
- Eliminar es baja lógica; si hay sesión en curso, primero se termina o cancela.

Los errores de validación usan 400; falta de sesión 401; permiso/consentimiento 403; registro ajeno o ausente 404; conflicto de estado 409; límite de intentos 429; dependencia o integridad no disponible 503. No todo tu módulo produce todos estos códigos: identificá los de cada recorrido.

## Demostración con datos ficticios

1. Crear rutina con dos ejercicios del lunes, uno manual y otro del catálogo.
2. Cambiar orden y descanso, guardar y recargar.
3. Iniciar entrenamiento y explicar por qué no es la misma entidad que la rutina.
4. Mostrar que no se puede eliminar mientras hay sesión activa.
5. Completar un objetivo asociado y volver a editar la rutina: debe funcionar.

## Preguntas con respuesta

**¿Rutina y entrenamiento son lo mismo?** La rutina prescribe; el entrenamiento registra lo realmente realizado.

**¿Qué evita guardar media rutina?** La transacción que reúne cabecera y ejercicios.

**¿Por qué no hay GIF en el catálogo?** Los textos tienen atribución MIT; los medios tienen licencia separada y no se redistribuyen.

## Límite con los otros integrantes

Paulo define el objetivo enlazado; Iván ejecuta las sesiones; Joaquín genera/adapta planes con IA, pero usa tu misma persistencia. No tenés que estudiar el chat para defender las rutinas manuales.

## Preparación para exponer

Podés presentar tu bloque así: «Mi funcionalidad es rutinas y catálogo de ejercicios. Voy a mostrar qué puede hacer el usuario, seguir una operación desde el formulario hasta MySQL y explicar qué ocurre si los datos o permisos no son válidos». Adaptalo a lo que realmente revisaste.

Estás preparado cuando podés demostrar el recorrido feliz, un rechazo, una cancelación donde exista y la persistencia después de recargar. Si falla un proveedor externo, explicá la alternativa real y no inventes una respuesta exitosa.

Antes de exponer, leé el [recorrido común](README.md) y el [informe de revisión](../docs/REVISION-FINAL.md). Anotá las comprobaciones y cambios reales en [REPARTO.md](../REPARTO.md).
