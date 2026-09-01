# Datos externos

## Ejercicios

Fuente: [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), revisión `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`.

Se distribuyen los 1.324 registros de texto: nombres, equipo, músculos e instrucciones en español e inglés. El archivo `models/exercises/provenance.json` conserva revisión, hash del original, hash del archivo distribuido, idiomas y cantidad. La aplicación verifica el hash local al arrancar. `LICENSE` y `UPSTREAM-NOTICE.md` junto al dataset conservan la licencia y avisos originales.

Los datos y textos están bajo MIT. Las imágenes y GIFs son de Gym visual y tienen licencia independiente. **GYM-OS no incluye ni carga esos medios**. Una eventual integración de imágenes exige una licencia válida del titular y su atribución; no basta con clonar el dataset.

Los nombres originales permanecen en inglés. Las instrucciones están disponibles en español y las categorías/equipos habituales tienen etiquetas traducidas. No se inventan traducciones de técnica.

## Información nutricional

El buscador consulta [Open Food Facts](https://world.openfoodfacts.org) mediante su [API documentada](https://openfoodfacts.github.io/openfoodfacts-server/api/). La base se ofrece bajo ODbL y los contenidos individuales bajo Database Contents License. Se conserva la atribución de cada alimento importado en su registro. No se redistribuye una copia de la base completa.

Los datos son colaborativos: pueden estar incompletos o ser incorrectos. Una respuesta sin todos los macros se marca como no disponible, no como cero. El usuario puede completar datos desde la etiqueta o ingresarlos manualmente. No se toman decisiones clínicas ni se certifican los valores.

Consulta por nombre o código de barras, caché de 10 minutos y límite global de 8 consultas/minuto para no superar la cuota de la IP del servidor. La interfaz debe buscar al confirmar, no con cada pulsación. Si la API falla, el ingreso manual sigue funcionando. `FOOD_API_BASE=https://world.openfoodfacts.net` utiliza el entorno de pruebas oficial; producción utiliza `.org`. La integración es de sólo lectura.

## Unidades de cálculo

Cada alimento declara cantidad y unidad. Los valores nutricionales ingresados corresponden a **100 g**, **100 ml** o **una porción**, según la unidad. El servidor multiplica por la cantidad y calcula totales; nunca acepta totales calculados por el navegador. No suma gramos y mililitros como si fueran la misma unidad.

Las comidas planificadas son independientes del consumo real: eliminar/modificar una dieta no cambia lo que el usuario ya registró. El día nutricional se calcula en la zona horaria del perfil, incluyendo los cambios de horario estacional.

## Datos de demostración y privacidad

Todos los ejemplos del sistema son ficticios y se activan explícitamente. Los PDFs, archivos comprimidos, claves, correos locales de recuperación y perfiles reales no se publican en GitHub. Los datos de usuarios sólo se usan en su cuenta; el catálogo de ejercicios no contiene datos personales.
