# Estado de entrega

GYM-OS implementa los 39 casos de uso relevados en las 27 secuencias, incluidos los cinco casos de IA. El código se publica en el repositorio público [tomimeno0/GYM-OS](https://github.com/tomimeno0/GYM-OS).

## Implementado

- Análisis de todos los adjuntos y revisión visual del UML y las 27 páginas de secuencias, con precedencia y contradicciones documentadas.
- JavaScript, React, Express, Sequelize y MySQL 8.4, con migraciones versionadas, roles iniciales y datos ficticios opcionales.
- Cuentas, recuperación, perfil, roles/permisos, bloqueo/activación, bitácora, integridad y eliminación de datos personales.
- Medidas históricas, objetivos, rutinas manuales y por IA, sesiones con cargas reales, planes alimentarios manuales y por IA, consumo, macros y progreso.
- CU015, CU019, CU023, CU026 y CU031 mediante Cohere por API: consentimiento explícito revocable, contexto mínimo, validación estructurada y de seguridad, persistencia transaccional, historial de chat, negativa fuera de alcance y errores seguros. No usa modelos locales.
- Clases de dominio con los nombres literales de métodos del UML, incluidos `definirObjeto`, `visuaizarObjetivo` y `encriptarRreversible`; los servicios ejecutan esas operaciones.
- Catálogo textual completo de 1.324 ejercicios con atribución MIT, sin imágenes/GIF con licencia separada.
- Frontend adaptable para todos los módulos, incluido Asistente IA, y administración completa.

## Validación

El repositorio comprueba formato, compilación de producción y vulnerabilidades conocidas de las dependencias. Las suites automatizadas y su documentación se retiraron por decisión del propietario el 31/08/2026.

Las capturas de escritorio y móvil usan cuentas ficticias y permanecen en `docs/screenshots/` como referencia visual del producto.

El archivo `.env` está ignorado y la clave de Cohere no se incluye en Git, documentación, capturas ni respuestas de la API. Antes de publicar se escanean los archivos versionados y el diff por patrones de secretos.

## Publicación

Repositorio público: [github.com/tomimeno0/GYM-OS](https://github.com/tomimeno0/GYM-OS). El flujo `verify.yml` repite formato, build y auditoría de dependencias en cada publicación a `main` y pull request.

SMTP y hosting de producción requieren proveedor y dominio propios. Cohere requiere una clave privada configurada en el entorno de ejecución. La publicación del código no equivale a un despliegue productivo.

## Entorno local

Directorio: `gymOS`. MySQL en `127.0.0.1:3307`, perfil/contexto Docker `colima-gymos`; prefijo local `docker-compose --context colima-gymos`. Frontend: `http://localhost:5173`; API: puerto 3000.

Fuentes y renders privados en `.local/sources` y `.local/analysis`, excluidos de Git. Las secuencias están en el PDF adjunto `GRAFICOS CASOS DE USO.pdf`; la carpeta `UML` recibida estaba vacía y el inventario literal se extrajo del UML dentro de `analisis de sistemas.pdf`.
