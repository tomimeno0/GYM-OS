# Estado de entrega

GYM-OS implementa los 39 casos de uso relevados en las 27 secuencias, incluidos los cinco casos de IA. El código se publica en el repositorio público [tomimeno0/GYM-OS](https://github.com/tomimeno0/GYM-OS).

## Implementado

- Análisis de todos los adjuntos y revisión visual del UML y las 27 páginas de secuencias, con precedencia y contradicciones documentadas.
- JavaScript, React, Express, Sequelize y MySQL 8.4, con migraciones versionadas, roles iniciales y datos ficticios opcionales.
- Cuentas, recuperación, perfil, roles/permisos, bloqueo/activación, bitácora, integridad y eliminación de datos personales.
- Medidas históricas, objetivos, rutinas manuales y por IA, sesiones con cargas reales, planes alimentarios manuales y por IA, consumo, macros y progreso.
- CU015, CU019, CU023, CU026 y CU031 mediante Cohere por API: consentimiento explícito revocable, contexto mínimo, validación estructurada y de seguridad, persistencia transaccional, historial de chat, negativa fuera de alcance y errores seguros. No usa modelos locales.
- Clases de dominio con los nombres literales de métodos del UML, incluidos `definirObjeto`, `visuaizarObjetivo` y `encriptarRreversible`; los controladores ejecutan esas operaciones.
- Catálogo textual completo de 1.324 ejercicios con atribución MIT, sin imágenes/GIF con licencia separada.
- Frontend adaptable para todos los módulos, incluido Asistente IA, y administración completa.

## Validación

La revisión del 18/10/2026 está en [REVISION-FINAL.md](REVISION-FINAL.md). Se comprobaron 126 recorridos/aserciones funcionales en una instancia MySQL aislada y 10 regresiones adicionales, además de pruebas puntuales de consentimiento revocado, bloqueo del modo simulado en producción y construcción local de correo. Se corrigieron problemas del historial deportivo, edición de planes vinculados a metas históricas, consentimiento y estado de formularios/chat.

Se ejecutaron formato, compilación y auditoría de dependencias: sin avisos conocidos al momento de la revisión. Se revisaron visualmente recorridos de escritorio y móvil con cuentas ficticias. La primera revisión de Cohere fue simulada; una verificación posterior del mismo día comprobó la API real con Command A: 19 solicitudes HTTP del recorrido completo, integridad final, rechazo fuera de alcance y consentimiento revocado. Se comprobó además una consulta real desde React y su historial. SMTP no se envió por red y no se certificó un despliegue productivo ni todos los navegadores.

No se reintrodujeron suites de tests versionadas, retiradas previamente por decisión del propietario. Los scripts y datos de auditoría permanecen privados en .local/analysis; los resultados y límites se documentan sin publicar credenciales.

Las capturas de escritorio y móvil usan cuentas ficticias y permanecen en `docs/screenshots/` como referencia visual del producto.

El archivo `.env` está ignorado y la clave de Cohere no se incluye en Git, documentación, capturas ni respuestas de la API. Antes de publicar se escanean los archivos versionados y el diff por patrones de secretos.

## Equipo

El [reparto funcional](../REPARTO.md) asigna nueve áreas completas del producto y enlaza [guías individuales](../guias/README.md). Las asignaciones son responsabilidades de preparación/revisión y no una afirmación de autoría.

## Publicación

Repositorio público: [github.com/tomimeno0/GYM-OS](https://github.com/tomimeno0/GYM-OS). El flujo `verify.yml` repite formato, build y auditoría de dependencias en cada publicación a `main` y pull request.

SMTP y hosting de producción requieren proveedor y dominio propios. Cohere requiere una clave privada configurada en el entorno de ejecución. La publicación del código no equivale a un despliegue productivo.

## Entorno local

Directorio: `gymOS`. MySQL en `127.0.0.1:3307`, perfil/contexto Docker `colima-gymos`; prefijo local `docker-compose --context colima-gymos`. Frontend: `http://localhost:5173`; API: puerto 3000.

Fuentes y renders privados en `.local/sources` y `.local/analysis`, excluidos de Git. Las secuencias están en el PDF adjunto `GRAFICOS CASOS DE USO.pdf`; la carpeta `UML` recibida estaba vacía y el inventario literal se extrajo del UML dentro de `analisis de sistemas.pdf`.
