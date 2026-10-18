# Reparto del sistema completo

Este reparto corresponde al **GYM-OS original**, no a Proyecto-Gym-OS (entrega reducida). Cada integrante prepara una funcionalidad completa de principio a fin: pantalla, reglas, API, datos y errores. No dividimos registro, cookie, validación y conexión entre nueve personas.

Se conserva «Gade Silva y Lápiz» como un solo integrante, según el listado recibido. La asignación es de estudio, revisión y responsabilidad; no constituye una afirmación de autoría. El código tuvo asistencia de Codex. Cada uno debe registrar sus aportes efectivos.

## Nueve funcionalidades

| Integrante         | Funcionalidad completa                   | Guía individual                                            |
| ------------------ | ---------------------------------------- | ---------------------------------------------------------- |
| Gianluca Pizarro   | Cuentas y acceso                         | [01-gianluca-pizarro.md](guias/01-gianluca-pizarro.md)     |
| Joaquín Casanou    | Rutinas y catálogo de ejercicios         | [08-joaquin-casanou.md](guias/08-joaquin-casanou.md)       |
| Iván Lerner        | Entrenamientos e historial de sesiones   | [03-ivan-lerner.md](guias/03-ivan-lerner.md)               |
| Paulo López        | Objetivos personales                     | [04-paulo-lopez.md](guias/04-paulo-lopez.md)               |
| Gade Silva y Lápiz | Perfil físico, progreso y panel          | [05-gade-silva-y-lapiz.md](guias/05-gade-silva-y-lapiz.md) |
| Valentín Schueld   | Dietas y planificación alimentaria       | [06-valentin-schueld.md](guias/06-valentin-schueld.md)     |
| Mateo Romani       | Registro alimentario, alimentos y macros | [07-mateo-romani.md](guias/07-mateo-romani.md)             |
| Tomás Menossi      | Asistente de IA y planes generados       | [02-tomas-menossi.md](guias/02-tomas-menossi.md)           |
| Simón Castellani   | Administración del sistema               | [09-simon-castellani.md](guias/09-simon-castellani.md)     |

## Qué cambió respecto del reparto anterior

Cuentas, acceso, recuperación y perfil personal quedan juntos a cargo de Gianluca. Joaquín se ocupa de rutinas/catálogo; Iván de las sesiones reales; Paulo de objetivos; Gade de las medidas y evolución/panel; Valentín de las dietas; Mateo del consumo y macros; Tomás de la IA; Simón de administración.

No hay un módulo independiente de recetas en el código actual: no se inventa uno para llenar un casillero. Las comidas compuestas pertenecen al plan o al consumo según su función. Los archivos pueden ser compartidos: Nutrition.jsx contiene dietas y consumo, pero cada responsable estudia componentes diferentes. Compartir archivo no obliga a repartirse líneas arbitrarias.

## Orden recomendado de exposición

1. Gianluca presenta inicio y recorrido de la cuenta.
2. Gade carga medidas iniciales y presenta panel/progreso.
3. Paulo define la meta y explica su avance.
4. Joaquín arma una rutina y usa el catálogo.
5. Iván realiza y guarda un entrenamiento.
6. Valentín crea un plan alimentario.
7. Mateo registra consumo real y compara macros.
8. Tomás muestra IA y distingue simulación de proveedor real.
9. Simón demuestra administración, bitácora e integridad.

Todos conocen el recorrido navegador -> Express -> controlador -> Sequelize -> MySQL. Cada uno profundiza en su funcionalidad y entiende qué entrega/recibe de los demás; no estudia todo el sistema palabra por palabra. Los detalles de ejecución y seguridad compartidos están en [guias/README.md](guias/README.md).

## Revisión y aportes efectivos

Completar después de la revisión individual. Usar identidad real en commits; no generar historial o atribuciones ficticias.

| Integrante         | Funcionalidad revisada                   | Comprobación o cambio realizado      | Evidencia/commit |
| ------------------ | ---------------------------------------- | ------------------------------------ | ---------------- |
| Gianluca Pizarro   | Cuentas y acceso                         | Pendiente de revisión del integrante | —                |
| Joaquín Casanou    | Rutinas y catálogo de ejercicios         | Pendiente de revisión del integrante | —                |
| Iván Lerner        | Entrenamientos e historial de sesiones   | Pendiente de revisión del integrante | —                |
| Paulo López        | Objetivos personales                     | Pendiente de revisión del integrante | —                |
| Gade Silva y Lápiz | Perfil físico, progreso y panel          | Pendiente de revisión del integrante | —                |
| Valentín Schueld   | Dietas y planificación alimentaria       | Pendiente de revisión del integrante | —                |
| Mateo Romani       | Registro alimentario, alimentos y macros | Pendiente de revisión del integrante | —                |
| Tomás Menossi      | Asistente de IA y planes generados       | Pendiente de revisión del integrante | —                |
| Simón Castellani   | Administración del sistema               | Pendiente de revisión del integrante | —                |
