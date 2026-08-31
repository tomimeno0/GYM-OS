# Estado de implementación

La meta completa permanece activa; no se considera un MVP ni una entrega final.

## Realizado

- Inventario y extracción de todos los adjuntos; lectura del UML y las 27 páginas de secuencias, CU001-CU039. Revisión de análisis de sistemas, DER, estructura api/client y rutas de referencia.
- Requisitos trazables y decisiones de conflictos documentadas. Frontend definido, aún no implementado.
- Monorepositorio npm workspaces, dependencias fijadas, configuración privada y Compose MySQL 8.4.
- Esquema inicial Sequelize para las entidades del DER y extensiones UML: historial físico, entrenamientos por ejercicio, alimentos por comida, sesiones, recuperaciones y conversaciones.
- Migración idempotente inicial, roles de sistema, cuentas demo explícitas y aleatorias.
- API de autenticación/perfil/administración, permisos, revocación de sesiones, recuperación, eliminación y bitácora.
- scrypt, AES-256-GCM, tokens con hash, DVH/DVV autenticados y transacciones que rechazan datos alterados.
- Auditoría npm sin vulnerabilidades tras actualizar uuid transitivo a 11.1.1 (Sequelize 6 sigue siendo obligatorio).

## Verificado

Última ejecución: 21 pruebas aprobadas en MySQL real, incluyendo expiración y concurrencia. Incluye flujos negativos, CSRF, permisos efectivos, bloqueo, borrado, recuperación de un solo uso y alteración deliberada de datos sin ocultarla con recálculo.

## Trabajo pendiente

1. Servicios y rutas de mediciones/objetivos/progreso, rutinas/entrenamientos, dieta/consumo/macros.
2. Dataset completo MIT, atribuciones y biblioteca; no reutilizar imágenes/GIFs de Gym visual sin licencia.
3. IA real (proveedor local/configurable), generación/adaptación validada, chat de soporte/entrenador y pruebas con proveedor real además de dobles de prueba.
4. Todo el frontend, conservando rutas `/`, `/dashboard`, `/nosotros`, `/me` y completando los módulos.
5. Ampliar pruebas de integración por CU, pruebas de navegación de extremo a extremo y revisión visual en navegador desktop/móvil.
6. Documentación de operación/backup, dataset, API, pruebas y seguridad; reproducibilidad de instalación.
7. Crear/publicar y verificar repositorio público GitHub `tomimeno0/GYM-OS` sin secretos. El perfil conectado `tomimeno0` fue confirmado; aún no se creó el remoto.

## Entorno local de trabajo

Docker/Colima perfil y contexto `colima-gymos`, MySQL 8.4 en `127.0.0.1:3307`. Usar `docker-compose --context colima-gymos` porque el comando plugin `docker compose` no está configurado en esta computadora. No alterar la instancia MariaDB existente ni otros contextos.

Fuentes extraídas y renders en `.local/sources` y `.local/analysis` (ignorados por Git). No volver a buscar las secuencias en la carpeta vacía: están en `GRAFICOS CASOS DE USO.pdf`.
