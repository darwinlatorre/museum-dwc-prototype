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
T1 | S1–S4 | inline | done | Co-localizar páginas/componentes/plantillas y adaptar límites, pruebas y documentación. Commit: d694c19. RED checker; GREEN checker/lint/225 pruebas/build. Risk: none.
T2 | S1–S5 | delegated + contraste inline | in_progress | Implementación y autoverificación del writer completas; limitación independiente aceptada por «Avanza.». Contraste funcional del padre en curso; sin commit. Risk: item 3 (contratos compartidos).
T3 | S1–S5 | inline + verificador | pending | Contraste funcional del padre, navegador y cierre pendientes de resolver T2. Revisión nativa no iniciada. Commit: pendiente.

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
L4. T1: d694c19, 347 líneas editadas con detección de renombres. Checker RED por app/app.ts ausente; primer build falló TS5097 (imports con .ts), corregido; GREEN checker/lint/225 pruebas/15 archivos/build. Advertencia bundle 649.97 kB. Assess inicial erró por ref abreviada; corregido con dev: medium, reviewDue false, under_budget, sin verificador independiente. Siguiente unidad delegada por context backstop; sin publicación.
L5. T2 writer mwa0gpo1-2-381s: completed, S1–S5. Reportó RED 2 fallos de rutas y GREEN focalizado 70; suite 233/17, checker/lint/build/diff-check aprobados. Primer build superó 1 MB; loadComponent para catálogo/fuentes corrigió el error, queda warning 658.86 kB/500 kB. Api.request intacto; endpoints/DTO trasladados a servicios propietarios. El padre contrastó rutas/layout/guard/transporte por lectura, no ejecutó aún spot check funcional ni navegador. No hay commit de T2.
L6. Assess T2 escalado item 3: high, independentVerifier true, nativeRisk unassessable por archivos nuevos sin selección. No se inició revisión nativa ni se obtuvo aprobación.
L7. Verificador único mwa0vany-3-vm8w: preparación falló porque copia /tmp/feature-verify-Cnkv8d conservó node_modules enlazado al workspace; su política exige dependencias copiadas sin enlaces. Detuvo sin ejecutar checks/diferencial. Inspección estructural S1–S4 favorable, S5 sin prueba independiente. Es evidencia inaccesible, no defecto de producto confirmado. No relanzar ni reparar/reintentar el verificador. No acceder ni retirar el scratch externo sin permiso específico.
L8. Needs your decision: aceptar explícitamente la limitación de prueba independiente o aportar evidencia independiente de los checks pendientes. Hasta esa decisión no continuar verificaciones, navegador, commit T2 ni revisión nativa. No se publicó ni integró nada.
L9. Usuario: «Avanza.» Acepta continuar con la limitación independiente explícita de la propuesta inmediata. No relanzar el verificador ni inventar aprobación; continuar contraste funcional del padre, navegador y revisión nativa aplicable, sin publicar/integrar.
