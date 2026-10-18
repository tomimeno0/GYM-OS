# Mateo Romani: Registro alimentario, alimentos y macros

Guía del **GYM-OS completo**. Reparto por funcionalidades para estudiar y revisar; no acredita autoría ni cambios que todavía no realizó cada integrante.

## Tu funcionalidad completa

Registrar lo que efectivamente comió el usuario, editarlo o eliminarlo, buscar datos nutricionales y comparar el consumo diario con un plan. Es un módulo de seguimiento, separado del editor de dietas de Valentín.

**Casos de uso:** CU029 y CU030. **Pantallas:** `/nutricion y buscador de alimentos en formularios`.

## Archivos que tenés que abrir

- [client/src/pages/Nutrition.jsx](../client/src/pages/Nutrition.jsx)
- [controllers/nutrition.controller.js](../controllers/nutrition.controller.js)
- [controllers/foods.controller.js](../controllers/foods.controller.js)
- [models/ComidaConsumida.model.js](../models/ComidaConsumida.model.js)
- [shared/schemas.js](../shared/schemas.js)
- [routes/fitness.routes.js](../routes/fitness.routes.js)

## Librerías y herramientas de tu módulo

React mantiene fecha, formularios y resumen; Intl y Date convierten horarios del dispositivo en instantes ISO. Luxon delimita el día de la zona del usuario. fetch consulta Open Food Facts desde el servidor con timeout. Zod valida consumo/alimentos; Sequelize consulta por usuario y rango de fecha.

## Funciones y componentes: qué hace cada uno

| Dónde ubicarlo                                                                                         | Qué recibe, hace y devuelve                                                                                                              |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [Nutrition](../client/src/pages/Nutrition.jsx#L315) en `client/src/pages/Nutrition.jsx`                | Controla fecha y dieta seleccionada; muestra consumo/macros y modales de alta/edición/baja.                                              |
| [ConsumedForm](../client/src/pages/Nutrition.jsx#L238) en `client/src/pages/Nutrition.jsx`             | Carga fecha/hora y alimentos; convierte datetime-local a ISO antes de guardar. El campo aclara que se usa la zona del dispositivo.       |
| [FoodEditor](../client/src/pages/Nutrition.jsx#L135) en `client/src/pages/Nutrition.jsx`               | Edita alimentos, unidad, cantidad y valores base; comparte uso con dietas.                                                               |
| [estimate](../client/src/pages/Nutrition.jsx#L65) en `client/src/pages/Nutrition.jsx`                  | Calcula vista previa en el navegador. No sustituye calculateMacros del servidor.                                                         |
| [FoodSearch](../client/src/pages/Nutrition.jsx#L72) en `client/src/pages/Nutrition.jsx`                | Busca nombre o código, presenta resultados y sólo permite agregar los que tienen macros disponibles.                                     |
| [calculateMacros](../controllers/nutrition.controller.js#L38) en `controllers/nutrition.controller.js` | Calcula factor cantidad/100 para g/ml o cantidad/1 para porciones. Redondea y verifica límites; reutiliza métodos UML de Dieta y Comida. |
| [saveConsumed](../controllers/nutrition.controller.js#L153) en `controllers/nutrition.controller.js`   | Rechaza fechas futuras, recalcula totales y crea o actualiza un registro propio, con auditoría.                                          |
| [removeConsumed](../controllers/nutrition.controller.js#L170) en `controllers/nutrition.controller.js` | Elimina un registro propio confirmado; no borra la dieta.                                                                                |
| [nutritionData](../controllers/nutrition.controller.js#L175) en `controllers/nutrition.controller.js`  | Calcula inicio/fin del día en la zona del usuario; suma consumo y carga dieta elegida o última activa. No mezcla usuarios.               |
| [getNutrition](../controllers/nutrition.controller.js#L204) en `controllers/nutrition.controller.js`   | Ejecuta consulta con autorización y bitácora CU030_CONSULTAR_MACROS.                                                                     |
| [normalizeFood](../controllers/foods.controller.js#L2) en `controllers/foods.controller.js`            | Transforma respuesta del proveedor a valores por 100 g, conserva fuente y marca disponible=false si faltan macros válidos.               |
| [searchFoods](../controllers/foods.controller.js#L31) en `controllers/foods.controller.js`             | Consulta por código o nombre, limita frecuencia, usa caché y timeout de ocho segundos y traduce fallos en error seguro.                  |
| [dayRange](../controllers/domain.controller.js#L48) en `controllers/domain.controller.js`              | Dado día y zona devuelve dos instantes: inicio inclusivo y fin exclusivo, válido también al cambiar horario de verano.                   |

Los enlaces señalan el inicio de la función en la versión revisada. Estudiá su responsabilidad y su llamada anterior/siguiente; no hace falta memorizar cada instrucción. Los sufijos Impl contienen la implementación delegada por los métodos literales UML.

## Datos que guarda y consulta

comidas_consumidas contiene propietario, nombre/tipo, instante, lista de alimentos y macros totales. Los valores del proveedor se normalizan y luego pueden revisarse contra etiqueta. No se persiste una base completa de productos importada ni se envían credenciales al proveedor.

## Endpoints para defenderlo

Todas estas rutas usan el prefijo `/api/v1`. Las mutaciones del navegador envían `X-GymOS-Client: web` y el origen configurado; las privadas requieren cookie válida.

| Método     | Ruta                                      | Resultado o condición                            |
| ---------- | ----------------------------------------- | ------------------------------------------------ |
| GET        | `/nutrition?date=AAAA-MM-DD&diet=UUID`    | Resumen del día y comparación con dieta opcional |
| POST       | `/consumed`                               | Registrar consumo                                |
| PUT/DELETE | `/consumed/:id`                           | Editar o borrar consumo propio                   |
| GET        | `/foods?q=nombre o /foods?barcode=codigo` | Una sola modalidad por consulta                  |

## Recorrido que tenés que explicar sin leer

Seleccionar día -> agregar comida con fecha/hora real -> escribir alimentos o buscar proveedor -> revisar valores por unidad y cantidad -> servidor recalcula -> persiste consumo -> resumen suma sólo el rango del día en zona del perfil -> compara con metas, sin asumir que el plan se comió.

## Reglas y errores que no podés omitir

- Datos faltantes del proveedor no equivalen a cero. Se puede cargar manualmente; la fuente debe conservarse.
- La cantidad cambia el aporte: 200 ml con base de 100 ml multiplica por dos; dos porciones multiplican por dos.
- El proveedor puede fallar o limitar solicitudes: no se guarda una comida a medias por una búsqueda fallida.
- El día se delimita por zona horaria del perfil; el input de hora usa el dispositivo y se etiqueta para evitar confundirlos.

Los errores de validación usan 400; falta de sesión 401; permiso/consentimiento 403; registro ajeno o ausente 404; conflicto de estado 409; límite de intentos 429; dependencia o integridad no disponible 503. No todo tu módulo produce todos estos códigos: identificá los de cada recorrido.

## Demostración con datos ficticios

1. Elegir fecha y registrar un alimento con cantidad distinta a 100.
2. Comprobar totales, editar cantidad y observar cambio.
3. Cancelar borrado y demostrar que sigue presente; confirmar después con un registro ficticio.
4. Comparar con una dieta sin confundir los totales planificados con consumidos.
5. Mostrar ingreso manual como alternativa ante caída del buscador.

## Preguntas con respuesta

**¿Falta de datos es cero calorías?** No; disponible=false impide tratar información incompleta como valores confiables.

**¿El formulario decide los totales definitivos?** No. La API recalcula antes de guardar.

**¿Por qué fecha y zona importan?** Un instante cercano a medianoche puede pertenecer a otro día según la zona del usuario.

## Límite con los otros integrantes

Valentín planifica alimentos; vos registrás consumo. Gade muestra resumen en el panel. Open Food Facts es consulta externa, no IA; Joaquín maneja Cohere.

## Preparación para exponer

Podés presentar tu bloque así: «Mi funcionalidad es registro alimentario, alimentos y macros. Voy a mostrar qué puede hacer el usuario, seguir una operación desde el formulario hasta MySQL y explicar qué ocurre si los datos o permisos no son válidos». Adaptalo a lo que realmente revisaste.

Estás preparado cuando podés demostrar el recorrido feliz, un rechazo, una cancelación donde exista y la persistencia después de recargar. Si falla un proveedor externo, explicá la alternativa real y no inventes una respuesta exitosa.

Antes de exponer, leé el [recorrido común](README.md) y el [informe de revisión](../docs/REVISION-FINAL.md). Anotá las comprobaciones y cambios reales en [REPARTO.md](../REPARTO.md).
