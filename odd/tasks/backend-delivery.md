# Cadena de revisión del backend
Objetivo: publicar los cambios verificados como tracker draft y siete cortes, sin aprobar ni fusionar PRs.
Destino: github.com/darwinlatorre/museum-dwc-prototype; base main@8e151509c96088a89143f4cf16601c4cad0d2719; estrategia feature-branch-chain; issue #3, referencias Refs.

## Specs
- S1: «has el PR».
- S2: «Sí, publicar allí la cadena elegida»; destino autorizado con la sesión configurada de GitHub CLI.
- S3: «Autorizar issue aprobada y preparar la cadena»; crear la issue y aplicar `status:approved`, crear etiquetas `type:refactor`, `type:chore` y `type:docs`, referencias no cerrantes `Refs`, bootstrap documental e integración local no destructiva.
- S4: «Publicar un tracker draft y siete cortes; **no aprobar ni fusionar PRs**.»

## Tasks
- T1 [S1–S3] done; destino/default/permisos ADMIN comprobados, issue #3 y etiquetas creadas con autorización humana; sin modificar código.
- T2 [S2–S4] done; tracker 583c8e4 y siete ramas preparadas por merges locales desde main, sin rebase ni force-push; árbol final igual a a470bc8 salvo este documento, conteos recalculados.
- T3 [S1–S4] done; ocho ramas publicadas atómicamente; tracker draft #4 y siete PRs #5–#11 abiertos con Refs #3, una etiqueta de tipo y enlaces de dependencia reales.
- T4 [S1–S4] done; SHA/head/base/labels/draft/open y ocho conteos GitHub/local contrastados, checks/statuses consultados (cero reportados); árbol funcional y cambios humanos preservados, sin aprobar ni fusionar PRs.

## Log
### L1 — Pedido y autorizaciones
has el PR

El humano autorizó «Sí, publicar allí la cadena elegida» y luego «Autorizar issue aprobada y preparar la cadena», con el alcance explícito de las Specs. Se aprobó la propuesta de issue «Refactorizar las capas y la generación del backend» y sus etiquetas/referencias antes de crearla.

### L2 — Base y límites
El default remoto es main@8e15150. Los PR #1/#2 ya están fusionados; arranque/entorno queda fuera de este alcance. El árbol de af5edab coincide con main, aunque las ramas locales no contienen su merge remoto: las ramas de entrega se crean desde el default real y conservan esa historia mediante merges normales.
No hay plantilla, CONTRIBUTING, rulesets ni checks obligatorios configurados. Los prerrequisitos de issue/etiquetas proceden de la skill activa y fueron autorizados; no se atribuyen a una política inexistente del repositorio. No usar type:feature para representar estos refactors.
Cambios humanos ajenos frontend/angular.json y .env.example no se leen/modifican/stagean. Las tareas se ejecutan en un worktree separado del mismo clon; no hay force-push, rebase, aprobación ni merge de PR.

### L3 — Cortes originales y ramas de entrega
| Corte | Resultado | Commit fuente | Rama de entrega | Base |
|---|---|---|---|---|
| Tracker | Plan draft/no-merge | main + este documento | refactor/backend-delivery | main |
| 1 | Capas de perfiles + HTTP compartido | a6bd16e | refactor/backend-review-01-profile | refactor/backend-delivery |
| 2 | Capas del catálogo | 3b99fb1 | refactor/backend-review-02-catalog | refactor/backend-review-01-profile |
| 3 | Checker/cierre de capas | 8dab659 | refactor/backend-review-03-architecture | refactor/backend-review-02-catalog |
| 4 | Lombok/MapStruct y procesadores | d53a1e1 | refactor/backend-review-04-codegen | refactor/backend-review-03-architecture |
| 5 | Generación en perfiles | 8f7b381 | refactor/backend-review-05-profile-codegen | refactor/backend-review-04-codegen |
| 6 | Generación en catálogo | 75395bb | refactor/backend-review-06-catalog-codegen | refactor/backend-review-05-profile-codegen |
| 7 | Documentación/cierre integrado | a470bc8 | refactor/backend-review-07-evidence | refactor/backend-review-06-catalog-codegen |

Los cortes originales tienen 727, 755, 264, 133, 554, 500 y 106 líneas añadidas/eliminadas con detección de renames. Los cuatro superiores a 400 conservan consumidores, pruebas y documentación de una unidad coherente: no se comprime ni se fragmenta artificialmente el código. Las cifras de entrega se recalculan después de los merges. El repo no tiene política size:exception.

### L4 — Evidencia y expectativas
La prueba integrada final aprobó 185 tests en 15 clases y package sobre copia aislada, 50/50 respuestas HTTP idénticas, 82/82 hashes, cinco mappers generados y verificador independiente sin bloqueadores. Corresponde al candidato final, **no** a cada corte individual; no se declaran suites nuevas ni CI remoto por abrir PRs. Las dos primeras reorganizaciones incluyeron aceptación previa documentada; ver VERIFICATION.md y las especificaciones de cada feature.
La evaluación nativa no estuvo disponible por archivos untracked; no es aprobación. No se considera saneado el antiguo backend/target compartido. No se prueban servicios/datos vivos ni se publica evidencia local ignorada.
El tracker debe permanecer draft/no-merge. Los hijos se revisan contra su padre inmediato; cualquier integración, retarget o aceptación posterior corresponde al humano.

### L5 — Preparación comprobada
Issue #3 abierta y status:approved confirmado; etiquetas autorizadas creadas. Sesión con permiso ADMIN. Bootstrap 583c8e4 sobre el default real, refs originales intactos.
Merges de entrega: 1=3da5ec9, 2=ea6886f, 3=8672cc4, 4=8214aa5, 5=6cda944, 6=84a644d, 7=5caa238. Los conteos antes de esta actualización del log coinciden con los cortes originales. Se recalcula el último corte para incluir el seguimiento de entrega. git diff del árbol final contra a470bc8, excluyendo únicamente este documento autorizado, no mostró diferencias. No se repitieron suites ni se atribuyó aprobación por PR.

### L6 — Publicación y cierre
Issue: https://github.com/darwinlatorre/museum-dwc-prototype/issues/3
Tracker draft/no-merge: https://github.com/darwinlatorre/museum-dwc-prototype/pull/4
Orden de revisión: [1 perfiles #5](https://github.com/darwinlatorre/museum-dwc-prototype/pull/5) → [2 catálogo #6](https://github.com/darwinlatorre/museum-dwc-prototype/pull/6) → [3 arquitectura #7](https://github.com/darwinlatorre/museum-dwc-prototype/pull/7) → [4 procesadores #8](https://github.com/darwinlatorre/museum-dwc-prototype/pull/8) → [5 generación perfil #9](https://github.com/darwinlatorre/museum-dwc-prototype/pull/9) → [6 generación catálogo #10](https://github.com/darwinlatorre/museum-dwc-prototype/pull/10) → [7 evidencia #11](https://github.com/darwinlatorre/museum-dwc-prototype/pull/11).
La creación de ocho PRs pasó, pero gh pr edit falló por repository.pullRequest.projectCards de Projects classic retirado. Se reconciliaron los ocho existentes y se actualizaron cuerpos con REST GET/PATCH, sin repetir creación; los marcadores se sustituyeron por números reales. Ocho PRs OPEN, exactamente un type:*, Refs #3 no cerrante y tracker draft comprobados. Los conteos GitHub coinciden con los rangos locales: 45/727/755/264/133/554/500/114 antes de este último registro documental.
Se consultaron check-runs y commit statuses de los ocho HEAD: cero reportados, no equivale a CI aprobado. El último corte solo suma el registro documental; sus conteos/cuerpo/HEAD se actualizan al publicar este cierre. No hay checks obligatorios configurados, aprobación nativa ni suites nuevas por corte. Los PRs quedan para revisión/integración humana.
Evidencia local ignorada: .browser/backend-pr/{chain.json,prs.json,verified-prs.json,checks.json,remote,push.stdout,push.stderr,push.exit}. Las ramas fuente originales y los cambios humanos frontend/angular.json/.env.example quedan intactos; no se accedió a dotenv. No hubo force-push, rebase, aprobación o merge de PR, ni cambios funcionales respecto de a470bc8 salvo este documento autorizado.
