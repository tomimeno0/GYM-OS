# Guía de uso

## Cuenta y perfil

1. Registrate con nombre, correo y contraseña de al menos diez caracteres. El rol inicial es Cliente.
2. En **Mi cuenta**, completá teléfono, fecha de nacimiento, género opcional y zona horaria. El correo identifica la cuenta y no se cambia desde este formulario.
3. En **Mi progreso → Registrar medidas**, cargá peso, altura y actividad. Los porcentajes y perímetros son opcionales. Cada actualización agrega una medición nueva y conserva el historial.
4. Para recuperar acceso, usá **Olvidé mi contraseña**. El enlace dura 30 minutos, sirve una vez y revoca todas las sesiones después del cambio.
5. Cerrar sesión exige confirmación. Eliminar una cuenta exige la contraseña y elimina sus datos personales y deportivos de forma irreversible.

## Objetivos y progreso

Solo puede haber un objetivo activo. Primero debe existir una medición. Elegí tipo, valor, fechas y frecuencia semanal. La unidad se selecciona según el tipo. El sistema rechaza metas incoherentes con el registro inicial.

El porcentaje compara el punto de partida con los datos registrados, no con una estimación de IA. Marcar un objetivo como cumplido es una declaración del usuario y se muestra separada del porcentaje medido. Para constancia se cuentan días distintos con sesiones completas en la semana; para distancia, la mayor distancia de una sesión completa desde el inicio del objetivo.

Las gráficas y tablas pueden mostrar distintos períodos. Eliminar un objetivo no elimina las medidas ni las sesiones anteriores.

## Rutinas y entrenamientos

En **Mis rutinas → Crear rutina**, organizá ejercicios por día. Podés usar el catálogo con instrucciones en español o crear un ejercicio propio. Ajustá series, repeticiones, carga, descanso, notas y orden. Los días vacíos se consideran libres.

Desde el detalle de la rutina elegí un día e iniciá el entrenamiento. Solo hay una sesión abierta a la vez. Marcá lo realizado y registrá las cargas reales. **Guardar avance** permite salir y retomar; **Finalizar** guarda una sesión completa o incompleta según los ejercicios realizados. Cancelar conserva el estado cancelado en el historial. Una sesión finalizada no se reabre.

Modificar una rutina no cambia los ejercicios ya registrados en sesiones anteriores. Una rutina con un entrenamiento abierto no puede eliminarse hasta terminarlo o cancelarlo.

## Nutrición

Los planes alimentarios son manuales. Definí sus metas con un profesional; GYM-OS no calcula una prescripción. Agregá comidas, horarios y alimentos. Los totales planificados se muestran separados de las metas.

Ingresá los nutrientes **por 100 g/ml**, o **por una porción** cuando elegís porciones. La cantidad multiplicará esos valores. Ejemplo ficticio: 150 g de un alimento con 100 kcal por 100 g aportan 150 kcal. No ingreses nuevamente el total de 150 kcal en el campo por 100 g.

Open Food Facts permite buscar por nombre o código de barras; sus datos son colaborativos. Revisá etiqueta y unidad. Si faltan nutrientes o falla el servicio, podés cargar manualmente el alimento; la aplicación no inventa valores faltantes.

En **Nutrición → Registrar comida**, guardá lo efectivamente consumido. Crear un plan no lo registra como consumido. Los resúmenes usan el día de tu zona horaria; el formulario de fecha/hora indica la zona del dispositivo y convierte el instante al guardarlo. Editar o eliminar un consumo recalcula los totales diarios sin cambiar el plan.

## Administración

El menú aparece según los permisos efectivos. Un rol personalizado puede habilitar fitness, consulta de usuarios, gestión de usuarios, gestión de roles, bitácora o integridad de forma independiente. No alcanza con conocer una URL: la API verifica los permisos.

- **Usuarios:** búsqueda, filtro por estado, asignación de roles, bloqueo, activación y eliminación. Cambiar estado o roles revoca las sesiones de esa cuenta.
- **Roles:** crear, editar y eliminar roles personalizados. Los roles de sistema están protegidos. Un rol asignado no se puede eliminar hasta quitar las asignaciones.
- **Bitácora:** eventos por fecha, módulo y resultado. No incluye contraseñas ni tokens.
- **Integridad:** comprueba DVH de cada fila y DVV de cada tabla. No repara ni recalcula automáticamente datos alterados.

El último administrador activo no puede bloquearse, eliminarse ni perder su rol de administrador.

## IA

La generación y adaptación automática de rutinas/dietas y el chat no están habilitados, por decisión explícita del responsable del proyecto. No se necesita ningún modelo local ni API key de IA para usar esta entrega.
