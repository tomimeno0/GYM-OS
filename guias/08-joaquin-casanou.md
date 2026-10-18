# Joaquín Casanou: Asistente de IA y planes generados

Guía del **GYM-OS completo**. Reparto por funcionalidades para estudiar y revisar; no acredita autoría ni cambios que todavía no realizó cada integrante.

## Tu funcionalidad completa

La funcionalidad de IA completa: consentimiento, generación/adaptación de rutinas y dietas, chat entrenador/soporte, historial, validación del resultado y fallos del proveedor. No es responsable de copiar un token o mantener un modelo local: se usa una API remota.

**Casos de uso:** CU015, CU019, CU023, CU026 y CU031. **Pantallas:** `/asistente, consentimiento en /me y enlaces a planes generados`.

## Archivos que tenés que abrir

- [client/src/pages/Assistant.jsx](../client/src/pages/Assistant.jsx)
- [controllers/ai.controller.js](../controllers/ai.controller.js)
- [controllers/cohere.controller.js](../controllers/cohere.controller.js)
- [controllers/domain.controller.js](../controllers/domain.controller.js)
- [models/Conversacion.model.js](../models/Conversacion.model.js)
- [models/Mensaje.model.js](../models/Mensaje.model.js)
- [routes/fitness.routes.js](../routes/fitness.routes.js)
- [config/env.js](../config/env.js)

## Librerías y herramientas de tu módulo

React administra acciones, selección e historial. fetch hace HTTPS desde Node a Cohere; AbortController impone timeout. Zod valida JSON de planes y hay validación adicional de seguridad. Sequelize guarda conversaciones/mensajes o planes mediante transacciones. La clave de API está sólo en entorno privado. La conexión real con Command A se verificó el 18/10/2026 con datos ficticios; no confundir esta comprobación puntual con disponibilidad permanente ni con una evaluación profesional de los planes.

## Funciones y componentes: qué hace cada uno

| Dónde ubicarlo                                                                                   | Qué recibe, hace y devuelve                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Assistant](../client/src/pages/Assistant.jsx#L224) en `client/src/pages/Assistant.jsx`          | Carga estado del proveedor y planes; habilita acciones sólo con disponibilidad y consentimiento.                                                                                                                                |
| [PlanTool](../client/src/pages/Assistant.jsx#L16) en `client/src/pages/Assistant.jsx`            | Elige generar nuevo o adaptar existente. execute manda preferencias/instrucciones y abre resultado; reemplazar plan exige confirmación.                                                                                         |
| [Chat](../client/src/pages/Assistant.jsx#L105) en `client/src/pages/Assistant.jsx`               | Mantiene conversación, modo y consulta. open carga historial con manejo de errores; el envío conserva conversación y lista. Mientras espera se bloquean cambios que mezclarían respuestas.                                      |
| [cohereChat](../controllers/cohere.controller.js#L6) en `controllers/cohere.controller.js`       | Envía modelo/mensajes y esquema JSON, usa timeout y hasta dos intentos de transporte, procesa solo texto final, rechaza salida truncada y devuelve errores sin clave ni bloques internos.                                       |
| [structuredChat](../controllers/ai.controller.js#L121) en `controllers/ai.controller.js`         | Interpreta el JSON del chat, exige booleano de alcance y respuesta no vacía, y permite hasta dos intentos ante contenido inválido sin guardar mensajes parciales.                                                               |
| [context](../controllers/ai.controller.js#L209) en `controllers/ai.controller.js`                | Consulta perfil, meta y actividad reciente del propietario. Exige consentimiento antes de preparar el plan.                                                                                                                     |
| [ensureAiConsent](../controllers/ai.controller.js#L257) en `controllers/ai.controller.js`        | Autoriza la función y comprueba consentimiento para chat.                                                                                                                                                                       |
| [parseJson](../controllers/ai.controller.js#L146) en `controllers/ai.controller.js`              | Interpreta salida e inyecta el objetivo autorizado; valida con Zod y traduce contratos inválidos a error seguro.                                                                                                                |
| [validateAiRoutine](../controllers/ai.controller.js#L266) en `controllers/ai.controller.js`      | Además de estructura limita series, repeticiones, carga y descanso mínimo antes de guardar.                                                                                                                                     |
| [validateAiDiet](../controllers/ai.controller.js#L283) en `controllers/ai.controller.js`         | Exige rango calórico y consistencia aproximada entre calorías y metas de macros.                                                                                                                                                |
| [generateStructuredPlan](../controllers/ai.controller.js#L315) en `controllers/ai.controller.js` | Genera y valida hasta dos respuestas; sólo pide corrección si el contrato/seguridad de salida falla.                                                                                                                            |
| [generateRoutine](../controllers/ai.controller.js#L339) en `controllers/ai.controller.js`        | Requiere perfil y objetivo, genera/valida y usa saveAiRoutine. Ejecuta nombres UML/secuencia de generación.                                                                                                                     |
| [adaptRoutine](../controllers/ai.controller.js#L388) en `controllers/ai.controller.js`           | Carga el plan propio y actividad previa, valida adaptación y reemplaza el plan sin reescribir sesiones.                                                                                                                         |
| [generateDiet](../controllers/ai.controller.js#L433) en `controllers/ai.controller.js`           | Requiere perfil/objetivo y usa saveAiDiet después de validación.                                                                                                                                                                |
| [adaptDiet](../controllers/ai.controller.js#L477) en `controllers/ai.controller.js`              | Exige progreso/actividad y valida antes de reemplazar el plan de dieta.                                                                                                                                                         |
| [chat](../controllers/ai.controller.js#L551) en `controllers/ai.controller.js`                   | Verifica modo e historial propio, limita contexto previo y guarda pregunta/respuesta juntas; fuera de alcance devuelve negativa.                                                                                                |
| [listConversations](../controllers/ai.controller.js#L525) en `controllers/ai.controller.js`      | Lista sólo conversaciones del usuario.                                                                                                                                                                                          |
| [getConversation](../controllers/ai.controller.js#L536) en `controllers/ai.controller.js`        | Carga cabecera y mensajes propios, ordenados por fecha.                                                                                                                                                                         |
| [aiStatus](../controllers/ai.controller.js#L663) en `controllers/ai.controller.js`               | Informa configuración/disponibilidad sin revelar clave; en modo real verifica y cachea cinco minutos. No confundir modo_prueba con proveedor real; la interfaz identifica la simulación y el arranque de producción la rechaza. |
| [writeFitness](../controllers/domain.controller.js#L31) en `controllers/domain.controller.js`    | Para módulo ia vuelve a exigir consentimiento dentro de la transacción: una revocación mientras respondía el proveedor impide guardar el resultado.                                                                             |

Los enlaces señalan el inicio de la función en la versión revisada. Estudiá su responsabilidad y su llamada anterior/siguiente; no hace falta memorizar cada instrucción. Los sufijos Impl contienen la implementación delegada por los métodos literales UML.

## Datos que guarda y consulta

conversaciones guarda usuario, modo entrenador/soporte, título y fecha. mensajes guarda conversación, rol user/assistant, texto y fecha. Los planes IA usan las mismas tablas de rutinas/dietas y tipo_generacion=ia; no una segunda base de planes.

## Endpoints para defenderlo

Todas estas rutas usan el prefijo `/api/v1`. Las mutaciones del navegador envían `X-GymOS-Client: web` y el origen configurado; las privadas requieren cookie válida.

| Método | Ruta                                             | Resultado o condición                       |
| ------ | ------------------------------------------------ | ------------------------------------------- |
| GET    | `/ai/status`                                     | Disponibilidad y modo_prueba                |
| POST   | `/ai/routines/generate y /ai/routines/:id/adapt` | Generar/adaptar rutina                      |
| POST   | `/ai/diets/generate y /ai/diets/:id/adapt`       | Generar/adaptar dieta                       |
| GET    | `/ai/conversations y /ai/conversations/:id`      | Historial propio                            |
| POST   | `/ai/chat`                                       | Consulta y conversación opcional; modo fijo |

## Recorrido que tenés que explicar sin leer

Usuario da consentimiento -> se autoriza y prepara contexto mínimo necesario -> adaptador llama a Cohere -> se valida JSON y límites -> transacción revalida usuario/consentimiento -> guarda plan o pregunta/respuesta -> interfaz muestra resultado o error sin perder el formulario.

## Reglas y errores que no podés omitir

- No mostrar o publicar COHERE_API_KEY. AI_MOCK=true produce respuestas locales simuladas para diagnóstico; no es una IA local ni una llamada real a Cohere.
- Revocar no retira datos que ya salieron al proveedor; bloquea nuevas solicitudes y, tras la corrección, el guardado de resultados en curso.
- No se promete seguridad médica: límites y avisos no sustituyen validación profesional.
- No presentar las pruebas simuladas como evidencia de cuota, calidad o disponibilidad real de Cohere.

Los errores de validación usan 400; falta de sesión 401; permiso/consentimiento 403; registro ajeno o ausente 404; conflicto de estado 409; límite de intentos 429; dependencia o integridad no disponible 503. No todo tu módulo produce todos estos códigos: identificá los de cada recorrido.

## Demostración con datos ficticios

1. Mostrar consentimiento desactivado y acceso bloqueado.
2. Activarlo y distinguir modo_prueba de disponibilidad real.
3. Generar plan en entorno de prueba y abrirlo en su módulo original.
4. Enviar consulta y volver a abrir historial; probar consulta fuera de alcance.
5. Explicar error de proveedor y revocación sin exponer ninguna credencial.

## Preguntas con respuesta

**¿Dónde corre el modelo?** En Cohere por HTTPS en uso real; no se ejecuta Llama local.

**¿Qué se valida además de JSON?** Rangos y coherencia de planes; propiedad, permisos y consentimiento antes de persistir.

**¿Se guarda media conversación si falla?** No. Pregunta/respuesta se guardan en una misma transacción; los fallos anteriores no persisten un resultado parcial.

## Límite con los otros integrantes

Gianluca ofrece el consentimiento del perfil. Tomás y Valentín reciben planes en sus tablas; Gade/Paulo/Iván aportan contexto. No les corresponde volver a estudiar todo el adaptador de Cohere.

## Preparación para exponer

Podés presentar tu bloque así: «Mi funcionalidad es asistente de ia y planes generados. Voy a mostrar qué puede hacer el usuario, seguir una operación desde el formulario hasta MySQL y explicar qué ocurre si los datos o permisos no son válidos». Adaptalo a lo que realmente revisaste.

Estás preparado cuando podés demostrar el recorrido feliz, un rechazo, una cancelación donde exista y la persistencia después de recargar. Si falla un proveedor externo, explicá la alternativa real y no inventes una respuesta exitosa.

Antes de exponer, leé el [recorrido común](README.md) y el [informe de revisión](../docs/REVISION-FINAL.md). Anotá las comprobaciones y cambios reales en [REPARTO.md](../REPARTO.md).
