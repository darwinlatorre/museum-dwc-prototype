# Arquitectura Angular por funcionalidad
Objetivo: refactorizar desde `dev` (ebcf020), sin incorporar cambios de otras ramas. Rama: `refactor/feature-architecture`.
Entrega: `auto-chain`, `feature-branch-chain`; no publicar ni integrar. Comprobaciones: Node checker, lint, Angular tests/build y navegador propio. Previsión: 900–1400 líneas editadas, además de movimientos.

## Specs
S1. «Implementa Feature-Based Architecture con Component Co-location, siguiendo los principios de Screaming Architecture. Refactoriza lo existente.» «Organizar el código por funcionalidades del negocio.» «Priorizar la organización por funcionalidad sobre una estructura global por tipo de archivo.»
S2. «Dentro de cada funcionalidad, separar components, pages, services, interfaces, guards y otras carpetas únicamente cuando sean necesarias. (Crea los services si es necesario)» «Verifica si es necesario crear layouts»
S3. «Cada componente o página Angular debe tener su propia carpeta.» «Los archivos pertenecientes a un componente deben permanecer dentro de su carpeta: .ts, .html, .scss y .spec.ts, cuando correspondan. (Separa el HTML del ts)» «Evitar componentes dispersos directamente dentro de components/ o pages/ sin una carpeta propia.»
S4. «Utilizar kebab-case para carpetas y archivos.» «Utilizar nombres descriptivos y consistentes.» «Colocar en shared/ únicamente los elementos reutilizables entre funcionalidades, evitando trasladar allí lógica específica del negocio.» «Respetar las convenciones de Angular y mantener la misma estructura en todas las funcionalidades del proyecto.»
S5. «Mejora la utilidad de las rutas.»

## Tasks
T1 | S1–S4 | inline | in_progress | Co-localizar páginas/componentes/plantillas y adaptar límites, pruebas y documentación. Commit: pendiente.
T2 | S1–S5 | inline | pending | Layout persistente, servicios de metadatos por propietario y rutas con protección de borrador; pruebas y documentación. Commit: pendiente.
T3 | S1–S5 | inline + verificador si hay riesgo nombrado | pending | Verificación integrada y navegador; registrar evidencia, límites y cierre. Commit: pendiente.

## Log
L1. Solicitud original:
> En base a la rama dev comienza a trabajar lo siguiente.
> Implementa Feature-Based Architecture con Component Co-location, siguiendo los principios de Screaming Architecture. Refactoriza lo existente.
>
> Reglas obligatorias:
> Organizar el código por funcionalidades del negocio.
> Dentro de cada funcionalidad, separar components, pages, services, interfaces, guards y otras carpetas únicamente cuando sean necesarias. (Crea los services si es necesario)
> Verifica si es necesario crear layouts
> Cada componente o página Angular debe tener su propia carpeta.
> Los archivos pertenecientes a un componente deben permanecer dentro de su carpeta: .ts, .html, .scss y .spec.ts, cuando correspondan. (Separa el HTML del ts)
> Utilizar kebab-case para carpetas y archivos.
> Utilizar nombres descriptivos y consistentes.
> Evitar componentes dispersos directamente dentro de components/ o pages/ sin una carpeta propia.
> Colocar en shared/ únicamente los elementos reutilizables entre funcionalidades, evitando trasladar allí lógica específica del negocio.
> Priorizar la organización por funcionalidad sobre una estructura global por tipo de archivo.
> Respetar las convenciones de Angular y mantener la misma estructura en todas las funcionalidades del proyecto.
> Mejora la utilidad de las rutas.
L2. Usuario eligió «Cadena sobre rama de trabajo (recomendado)». Preparar unidades dependientes; no implica autorización de publicación.
L3. Worktree aislado `.browser/worktrees/feature-architecture` desde dev; cambio ajeno backend y cuatro commits posteriores permanecen intactos. Explorador confirmó rutas vacías y necesidad de mantener importador montado. Se conservará el transporte de dev sin incorporar la rama HttpClient/environments. Rutas previstas /analisis, /fuentes-de-registros, /catalogo; no publicar pasos internos ni introducir guards de autenticación.
