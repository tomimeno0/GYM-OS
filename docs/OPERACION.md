# Operación y seguridad

## Instalación

`npm ci` reproduce las versiones del lockfile. `npm run setup` genera cuatro secretos independientes y la contraseña de demostración, con permisos 0600. Nunca reemplaza `.env`. No copiar los secretos de otra instalación.

Compose ejecuta únicamente MySQL 8.4 en un volumen persistente y expone `DB_PORT` (3307 por defecto) solo en loopback. Esto permite comprobar una instalación limpia con otro puerto y nombre de proyecto sin tocar un volumen existente. `scripts/mysql-init.sql` habilita `gym_os_test` al crear un volumen nuevo. Si cambiás `DB_USER`, adaptá ese script antes de crear el volumen; no cambies usuarios de una base existente sin una migración específica.

Las migraciones son versionadas e idempotentes. La segunda añade valores iniciales de objetivos y distancia de entrenamientos, comprueba las firmas anteriores y vuelve a firmar el esquema actualizado. **Detené la API antes de migrar** y tomá un respaldo. No uses `sequelize.sync({force:true})` sobre datos reales.

## Configuración

| Variable                                                                           | Uso                                                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `NODE_ENV`                                                                         | `development`, `test` o `production`                                            |
| `PORT`                                                                             | API, 3000 por defecto                                                           |
| `APP_ORIGIN`                                                                       | Origen exacto del frontend; `http://localhost:5173` en desarrollo               |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`                          | Acceso a MySQL                                                                  |
| `MYSQL_ROOT_PASSWORD`                                                              | Inicialización del contenedor; no se usa en la API                              |
| `ENCRYPTION_KEY`                                                                   | 32 bytes hex; AES-256-GCM para teléfono                                         |
| `INTEGRITY_KEY`                                                                    | 32 bytes hex independientes; HMAC de integridad                                 |
| `MAIL_TRANSPORT`                                                                   | `file` solo para desarrollo/pruebas; SMTP para uso real                         |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Entrega real de recuperación                                                    |
| `DEMO_PASSWORD`                                                                    | Solo cuentas ficticias creadas con `--demo`                                     |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`                                      | Entrada privada del comando `npm run admin:create`; no se imprime la clave      |
| `FOOD_API_BASE`                                                                    | Opcional, únicamente dominio oficial `.org` o staging `.net` de Open Food Facts |
| `FOOD_USER_AGENT`                                                                  | Identificación del proyecto ante Open Food Facts                                |
| `AI_PROVIDER`                                                                      | Proveedor IA; actualmente `cohere`                                              |
| `COHERE_API_KEY`                                                                   | Clave privada de Cohere; solo en `.env` o gestor de secretos                    |
| `COHERE_MODEL`                                                                     | Modelo Cohere; por defecto `command-a-plus-05-2026`                             |
| `AI_MOCK`                                                                          | Solo pruebas automatizadas; nunca activar en producción                         |
| `AI_TIMEOUT_MS`                                                                    | Timeout por intento contra Cohere; 60000 ms por defecto                         |

La integración IA realiza llamadas HTTPS a Cohere únicamente después del consentimiento del usuario. La clave no se devuelve en estado, logs ni errores. Las respuestas estructuradas se validan con Zod y límites de seguridad antes de iniciar la transacción; un fallo, timeout, JSON inválido o plan inseguro no guarda cambios parciales. Solo se reintentan una vez los timeouts, `429` y errores `5xx`; los errores de contrato no se ocultan. `AI_MOCK=true` se reserva para pruebas deterministas.

## Despliegue real

1. Prepará MySQL, ejecutá migraciones y `npm run db:seed` **sin `--demo`**.
2. Definí las tres variables `ADMIN_*` mediante el gestor privado de secretos del entorno y ejecutá `npm run admin:create`. No pongas la contraseña en argumentos o en un comando que quede en el historial. El comando rechaza una cuenta existente: no eleva sus permisos silenciosamente. Quitá esas variables tras crear el administrador.
3. Ejecutá `npm run build`. `npm start` sirve API y `client/dist` desde Express, en loopback.
4. Colocá un proxy HTTPS delante, en el mismo host, con `APP_ORIGIN=https://tu-dominio` y `NODE_ENV=production`. El proceso rechaza producción sin HTTPS y las cookies son Secure. No expongas MySQL públicamente.
5. Configurá `COHERE_API_KEY` en el gestor de secretos del entorno y verificá `/api/v1/ai/status`; no la incrustes en el frontend. Configurá SMTP y comprobá recuperación con una cuenta propia de prueba. Sin SMTP real, los correos de desarrollo quedan en `.local/mail/` y no llegan al usuario.
6. Para acceso detrás de un proxy, planificá límites por usuario/IP: esta versión no confía en `X-Forwarded-For` arbitrario y el límite puede compartirse entre solicitudes que lleguen desde el proxy. No habilites `trust proxy=true` indiscriminadamente.
7. Usá un supervisor de procesos, respaldos cifrados, monitorización y control de acceso al host. La publicación del código en GitHub no equivale a un despliegue de producción.

## Respaldo y restauración

Respaldá **juntos** la base de datos y las claves de cifrado/integridad, en un almacenamiento cifrado y restringido. Sin las claves originales no se pueden descifrar teléfonos ni validar firmas. No se deben rotar estas claves editando `.env` sin una migración controlada.

Ejemplo para Compose, con la API detenida y ejecutado desde una terminal privada:

```sh
mkdir -p .local/backups
chmod 700 .local/backups
umask 077
docker compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers --no-tablespaces --set-gtid-purged=OFF gym_os' > .local/backups/gym_os.sql
```

La contraseña se expande dentro del contenedor y no se imprime. Adaptá únicamente el prefijo Compose a tu contexto Docker. No uses `docker compose down -v` para detener la aplicación: elimina el volumen.

Para restaurar, usá primero una instancia aislada del mismo esquema y las claves originales; verificá permisos del archivo, integridad de la copia y DVH/DVV antes de sustituir datos reales. La importación sobrescribe datos existentes: requiere una decisión explícita del operador y un respaldo previo. No hay reparación automática ni “recalcular firmas” público.

## Límites conocidos

La firma de tablas completas y el mutex transaccional priorizan integridad y reproducibilidad de este proyecto. Su costo crece con el volumen: una instalación con muchos usuarios requiere medir carga y rediseñar la auditoría por particiones o lotes, sin perder garantías. No se afirma haber realizado una prueba de carga de producción.

La API acepta únicamente su origen configurado y encabezado de cliente; usa cookies HttpOnly, validación estricta, consultas Sequelize, contraseñas scrypt, cifrado autenticado, tokens aleatorios almacenados con hash, permisos efectivos y revocación de sesiones. Estos controles no sustituyen revisión de seguridad y operación responsable del host.
