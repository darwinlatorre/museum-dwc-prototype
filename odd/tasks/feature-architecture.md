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
T2 | S1–S5 | delegated + contraste inline | done | Layout, servicios y rutas; padre contrastó checker/lint/233 pruebas/build/diferencial/navegador. Commit: efb0396. Limitación independiente aceptada por «Avanza.». Risk: item 3 (contratos compartidos).
T3 | S1–S5 | inline, verificador indisponible aceptado | done | Checks y navegador observados, evidencia en efb0396 y cierre documental. Assess medium nativo, reviewDue=false/under_budget: no iniciar review. Limitación independiente y timeout de automatización registrados.

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
L10. Padre: checker/lint/233 pruebas/17 archivos/build/diff-check salida0; warning658.86kB. Diferencial público único de cuatro operaciones y errores frente d694c19: stdout/stderr/exit idénticos. Chromium propio con permiso puntual de caché/sesión: rutas directas, redirects/títulos, estado del importador, guardas, preview/worker, Escape/foco, capturas desktop/móvil abiertas. Build real + GET ficticios aislados, no backend vivo. Incidente timeout30s de back con confirmación pendiente; sin repetir maniobra, dismiss conservó URL/texto. Evidencia completa y límites en VERIFICATION.md. Navegador cerrado/servidor detenido.
L11. Unidad T2 efb0396:1276 líneas editadas. Se conserva unidad coherente layout+rutas+servicios+pruebas para evitar estados intermedios rotos, sin recortar pruebas. Cadena prevista (sin publicar): slice1 dev..d694c19 co-location; slice2 d694c19..efb0396 navegación/contratos (Risk:item3); slice3 cierre documental. Review workload superior a400 informado; aceptación de cadena no crea PR.
L12. Assess cometido T2 desde d694c199b5e89375b0568859555662cb8c33fe55: nativeRisk medium, escalación item3 high, reviewDue=false, reviewDueReason=under_budget. La escalación no altera reviewDue; no INSPECT/START ni consentir por cuenta del usuario. Verificador independiente sigue indisponible con limitación aceptada; no aprobación nativa.

L13. Cierre: S1–S5 implementadas y contrastadas con límites aceptados. Pruebas backend/Compose no aplicables a este diff, npm audit no repetida. Revisión nativa no debida, no aprobación inventada. Backend ajeno permanece intacto en worktree original. Siguiente paso humano: revisar unidades locales antes de cualquier publicación o integración en dev.
