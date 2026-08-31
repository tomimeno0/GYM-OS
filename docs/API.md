# API HTTP

Base: `/api/v1`. JSON. Todas las mutaciones requieren `X-GymOS-Client: web` y, si existe `Origin`, debe coincidir con `APP_ORIGIN`. Las rutas privadas usan la cookie `gymos_session` HttpOnly, SameSite=Lax; Secure en producción. No hay token guardado en localStorage.

Los esquemas exactos están en `shared/schemas.js`. Se rechazan propiedades no reconocidas en las escrituras. Identificadores propios UUID; los IDs del catálogo externo son cadenas numéricas. Errores: `{ "error": { "code": "...", "message": "...", "details": [] } }`. Los detalles de validación son opcionales.

| Método           | Ruta                                              | Operación                                              |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------ |
| POST             | `/auth/register`                                  | Registro; devuelve usuario y cookie                    |
| POST             | `/auth/login`                                     | Iniciar sesión                                         |
| POST             | `/auth/logout`                                    | Cerrar sesión; `{confirmar:true}`                      |
| POST             | `/auth/forgot-password`                           | Solicitar enlace por correo                            |
| POST             | `/auth/reset-password`                            | Consumir token temporal y nueva contraseña             |
| GET, PATCH       | `/me`                                             | Ver/editar datos de la cuenta                          |
| DELETE           | `/me`                                             | `{confirmar:true,password}`; borrado irreversible      |
| GET              | `/dashboard`                                      | Resumen de progreso, nutrición y entrenamiento abierto |
| GET              | `/measurements`                                   | Historial paginado                                     |
| POST             | `/measurements/initial`                           | Primera medición                                       |
| POST             | `/measurements`                                   | Nueva medición posterior                               |
| GET, POST        | `/goals`                                          | Listar/crear objetivo                                  |
| POST             | `/goals/:id/complete`                             | Completar; confirmación requerida                      |
| DELETE           | `/goals/:id`                                      | Baja lógica; confirmación requerida                    |
| GET              | `/progress?days=90`                               | Progreso e historial del período (7–730 días)          |
| GET, POST        | `/routines`                                       | Listar/crear rutina manual                             |
| GET, PUT, DELETE | `/routines/:id`                                   | Detalle, reemplazo de plan y baja lógica               |
| GET, POST        | `/workouts`                                       | Historial paginado/iniciar sesión                      |
| GET, PUT         | `/workouts/:id`                                   | Detalle/registrar todos los ejercicios de la sesión    |
| GET, POST        | `/diets`                                          | Listar/crear plan manual                               |
| GET, PUT, DELETE | `/diets/:id`                                      | Detalle, reemplazo de comidas y baja lógica            |
| GET              | `/nutrition?date=YYYY-MM-DD&diet=UUID`            | Consumos y totales diarios; filtros opcionales         |
| POST             | `/consumed`                                       | Registrar comida consumida                             |
| PUT, DELETE      | `/consumed/:id`                                   | Editar/eliminar consumo                                |
| GET              | `/exercises?q=&category=&equipment=&page=&limit=` | Catálogo textual filtrado                              |
| GET              | `/exercises/:id`                                  | Instrucciones de un ejercicio                          |
| GET              | `/foods?q=nombre` o `/foods?barcode=codigo`       | Búsqueda externa, requiere exactamente un filtro       |
| GET              | `/ai/status`                                      | Estado sin revelar credenciales                        |
| POST             | `/ai/routines/generate`                           | Generar rutina con perfil y objetivo                   |
| POST             | `/ai/routines/:id/adapt`                          | Adaptar rutina con historial                           |
| POST             | `/ai/diets/generate`                              | Generar dieta orientativa                              |
| POST             | `/ai/diets/:id/adapt`                             | Adaptar dieta con contexto                             |
| GET              | `/ai/conversations`                               | Listar conversaciones propias                          |
| GET              | `/ai/conversations/:id`                           | Conversación y mensajes propios                        |
| POST             | `/ai/chat`                                        | Consultar en modo entrenador o soporte                 |
| GET              | `/admin/users?q=&estado=&page=&limit=`            | Usuarios filtrados                                     |
| GET, POST        | `/admin/roles`                                    | Listar/crear roles                                     |
| PUT, DELETE      | `/admin/roles/:id`                                | Editar/eliminar rol personalizado                      |
| PUT              | `/admin/users/:id/roles`                          | `{roles:[UUID],confirmar:true}`                        |
| PATCH            | `/admin/users/:id/status`                         | `{estado:"activo" o "bloqueado",confirmar:true}`       |
| DELETE           | `/admin/users/:id`                                | Borrado confirmado de usuario                          |
| GET              | `/admin/audit?modulo=&resultado=&page=&limit=`    | Bitácora paginada                                      |
| GET              | `/admin/integrity`                                | Informe de firmas sin modificar datos                  |

Los DELETE fitness/administración requieren `{confirmar:true}`. Las rutas de fitness exigen `fitness:use`; administración verifica el permiso específico de cada operación. El aislamiento por usuario se aplica en consultas y escrituras.

Listas paginadas: `{items,total}`, página inicial 1, límite inicial 25 y máximo 100. Catálogo admite filtros y devuelve opciones de categorías/equipo y páginas. Listas de rutinas, dietas y objetivos devuelven `{items}`.

Salud: `GET /api/health`, fuera de `/api/v1`, comprueba conexión MySQL. Las rutas IA tienen límite por minuto, validan alcance y devuelven 503 sin datos del proveedor cuando Cohere no está disponible.
