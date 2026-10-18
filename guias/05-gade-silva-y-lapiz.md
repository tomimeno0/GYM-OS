# Gade Silva y Lápiz: Perfil físico, progreso y panel

Guía del **GYM-OS completo**. Reparto por funcionalidades para estudiar y revisar; no acredita autoría ni cambios que todavía no realizó cada integrante.

## Tu funcionalidad completa

Registrar el punto de partida corporal, agregar mediciones históricas y mostrar la evolución junto con el resumen del día. Incluye el panel que integra datos de los demás módulos; no incluye definir la meta, que corresponde a Paulo.

**Casos de uso:** CU007, CU008 y visualización CU011. **Pantallas:** `/progreso y /dashboard`.

## Archivos que tenés que abrir

- [client/src/pages/Fitness.jsx](../client/src/pages/Fitness.jsx)
- [controllers/fitness.controller.js](../controllers/fitness.controller.js)
- [controllers/domain.controller.js](../controllers/domain.controller.js)
- [models/MedicionFisica.model.js](../models/MedicionFisica.model.js)
- [routes/fitness.routes.js](../routes/fitness.routes.js)
- [client/src/components/ui.jsx](../client/src/components/ui.jsx)

## Librerías y herramientas de tu módulo

React conserva el formulario; Recharts representa evolución de peso; Luxon maneja zona horaria, períodos y semanas. Sequelize recupera mediciones y sesiones. Zod valida rangos físicos, porcentajes y fecha. Los componentes Stat/Meter/Resource ofrecen indicadores y estados de carga.

## Funciones y componentes: qué hace cada uno

| Dónde ubicarlo                                                                                          | Qué recibe, hace y devuelve                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [MeasurementForm](../client/src/pages/Fitness.jsx#L285) en `client/src/pages/Fitness.jsx`               | Inicializa con la última medida, convierte campos opcionales vacíos a null y usa endpoint inicial o actualización. No sobrescribe la medición anterior.      |
| [Progress](../client/src/pages/Fitness.jsx#L367) en `client/src/pages/Fitness.jsx`                      | Consulta datos del período, compara inicial/actual, muestra historial y abre el modal de nueva medición.                                                     |
| [WeightChart](../client/src/pages/Fitness.jsx#L51) en `client/src/pages/Fitness.jsx`                    | Transforma mediciones en puntos de fecha/peso y dibuja el área; si no hay datos muestra estado vacío.                                                        |
| [Dashboard](../client/src/pages/Fitness.jsx#L105) en `client/src/pages/Fitness.jsx`                     | Integra progreso, nutrición del día, rutinas y sesión activa. No inventa datos cuando faltan.                                                                |
| [latestMeasurement](../controllers/fitness.controller.js#L24) en `controllers/fitness.controller.js`    | Busca por usuario y fecha descendente; acepta límite temporal para capturar la base de un objetivo.                                                          |
| [updatePhysicalFields](../controllers/fitness.controller.js#L57) en `controllers/fitness.controller.js` | Invoca métodos literales de PerfilFisico y prepara peso, altura, grasa, músculo y actividad.                                                                 |
| [addMeasurement](../controllers/fitness.controller.js#L104) en `controllers/fitness.controller.js`      | Ejecuta MedicionCorporal.actualizarMedicion. Exige inicial única o perfil previo y fecha posterior/no futura. Inserta un nuevo registro.                     |
| [listMeasurements](../controllers/fitness.controller.js#L43) en `controllers/fitness.controller.js`     | Devuelve historial paginado del propietario.                                                                                                                 |
| [progressData](../controllers/fitness.controller.js#L270) en `controllers/fitness.controller.js`        | Reúne mediciones, metas y entrenamientos. Devuelve inicial/actual, diferencia de peso, series del período y sesiones completadas; deduplica días entrenados. |
| [getProgress](../controllers/fitness.controller.js#L345) en `controllers/fitness.controller.js`         | Ejecuta Cliente.verProgreso y autoriza la lectura. No altera las medidas.                                                                                    |
| [today](../controllers/domain.controller.js#L45) en `controllers/domain.controller.js`                  | Calcula fecha según zona horaria del usuario; no se toma simplemente el día UTC.                                                                             |
| [notFuture](../controllers/domain.controller.js#L53) en `controllers/domain.controller.js`              | Rechaza registros futuros con tolerancia acotada de reloj; el esquema también valida formato.                                                                |

Los enlaces señalan el inicio de la función en la versión revisada. Estudiá su responsabilidad y su llamada anterior/siguiente; no hace falta memorizar cada instrucción. Los sufijos Impl contienen la implementación delegada por los métodos literales UML.

## Datos que guarda y consulta

mediciones_fisicas guarda peso, altura, grasa, músculo, actividad, fecha y perímetros opcionales. Perfil físico es la última medición, no una fila que se reescribe. Progreso es un resultado calculado: no existe una tabla inventada para cada tarjeta del panel.

## Endpoints para defenderlo

Todas estas rutas usan el prefijo `/api/v1`. Las mutaciones del navegador envían `X-GymOS-Client: web` y el origen configurado; las privadas requieren cookie válida.

| Método | Ruta                    | Resultado o condición                    |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/measurements/initial` | Primera medición                         |
| POST   | `/measurements`         | Actualización como nueva fila            |
| GET    | `/measurements`         | Historial paginado                       |
| GET    | `/progress?days=90`     | Evolución y métricas                     |
| GET    | `/dashboard`            | Resumen de progreso, nutrición y rutinas |

## Recorrido que tenés que explicar sin leer

Peso/altura y opcionales -> validación -> nueva fila con firma de integridad y bitácora -> consulta ordenada -> comparación inicial/última -> gráfico del período. El panel llama controladores de nutrición y sesiones, por eso no debe recalcular esos datos con valores ficticios.

## Reglas y errores que no podés omitir

- La actualización nunca borra el punto de partida. Debe ser posterior a la última medición.
- Si falta porcentaje de grasa, no equivale a 0; se conserva null. Grasa y músculo juntos no pueden exceder 100.
- Entrenamientos de la semana cuenta días distintos con sesiones completas, no todos los intentos.
- El gráfico puede mostrar sólo 90 días mientras la medición inicial histórica se conserva para comparar.

Los errores de validación usan 400; falta de sesión 401; permiso/consentimiento 403; registro ajeno o ausente 404; conflicto de estado 409; límite de intentos 429; dependencia o integridad no disponible 503. No todo tu módulo produce todos estos códigos: identificá los de cada recorrido.

## Demostración con datos ficticios

1. Abrir con cuenta nueva y mostrar estado sin datos.
2. Cargar perfil inicial; registrar una segunda medición.
3. Comparar valores e historial y cambiar período del gráfico.
4. Abrir panel y relacionar cada indicador con su módulo.
5. Mostrar rechazo de fecha futura o porcentajes imposibles sin alterar el historial.

## Preguntas con respuesta

**¿Actualizar peso edita una fila?** No; agrega una medición con fecha e historial.

**¿El panel contiene sus propias tablas?** No; agrega datos existentes de progreso, nutrición, rutinas y sesiones.

**¿Por qué dos sesiones hoy no son dos días de constancia?** La métrica semanal cuenta fechas distintas para no duplicar días.

## Límite con los otros integrantes

Gianluca maneja perfil personal, vos el corporal. Paulo define y completa objetivos. Iván provee sesiones, Mateo consumo y Valentín planes. El panel presenta sus resultados sin sustituir sus reglas.

## Preparación para exponer

Podés presentar tu bloque así: «Mi funcionalidad es perfil físico, progreso y panel. Voy a mostrar qué puede hacer el usuario, seguir una operación desde el formulario hasta MySQL y explicar qué ocurre si los datos o permisos no son válidos». Adaptalo a lo que realmente revisaste.

Estás preparado cuando podés demostrar el recorrido feliz, un rechazo, una cancelación donde exista y la persistencia después de recargar. Si falla un proveedor externo, explicá la alternativa real y no inventes una respuesta exitosa.

Antes de exponer, leé el [recorrido común](README.md) y el [informe de revisión](../docs/REVISION-FINAL.md). Anotá las comprobaciones y cambios reales en [REPARTO.md](../REPARTO.md).
