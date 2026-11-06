# Normalización automática y revisión compacta de cambios
Seis reglas fijas en Normalizar; filas modificadas por defecto, vista completa opcional y ocultación visual de columnas vacías.
Rama actual C4/C5 `feat/normalization-changes-review`, base de la evolución `505d60d`; delivery_strategy `auto-chain`, chain_strategy `stacked-to-main`, destino `main`; previsión1000–1300líneas autorales/running990 observadas C1–C4 + C5 documental pendiente (sin total final). Cortes locales coherentes, sin publicación; runner serial `.browser/normalization/vitest.serial.config.mjs`.

## Specs

1. **S1**: «1. Has que estas opciones siempre esten aplicada (No coloques un slide para ellos)
Eliminar espacios al inicio y al final
Tratar NULL y N/A como vacíos (sin distinguir mayúsculas)
Fechas Darwin Core
Coordenadas decimales
Valores numéricos Darwin Core
Comprobar duplicados»
2. **S2**: «2. Solamente muestra los datos-filas que han tenido cambios»
3. **S3**: «3. Dale la opcion al usuario de mostrar todos los datos»
4. **S4**: «4. manten la opcion de ocultar columnas sin datos»
5. **S5**: «5. Elimina tanto texto dentro de la interfaz, recurre a los skills de ui/ux y de diseño para tomar estas deciciones y mejora la interfaz.»

## Tasks

- **T1 [S1–S5]** — done — preparación de diseño/especificación/contrato completada en C1 `fc4f4224b88ebe6ec8e09ff2a695bbcc599bef43`; padre observó JS/estructura/diff exit0. No certifica UI funcional productiva. Véase L5.
- **T2 [S2,S3,S4]** — done — implementación C2 y comprobaciones propias/públicas en `143d55985a8677942206c7c5c0da007198447b64`: RED público válido y GREEN107/4archivos,99pruebas anteriores preservadas; arquitectura/diff exit0. Risk:item4; aceptación independiente integrada completada después en T4. Véanse L6/L10.
- **T3 [S1–S5]** — done — implementación en C3 `b787754d6452bbf921fcc1cdd3d03becd7904431` y C4 `021f9e29404e243c268e84724648423349a26866`, GREEN público final71/3archivos y lectura de estado/template completos por el padre. S1 preservado y S2–S5 implementados; aceptación integrada separada en T4 ya completada. Véanse L8/L10.
- **T4 [S1–S5]** — done — independiente integrado item4, seam225/15+checker/build y navegador real principal más continuación de cinco pendientes, contrastados por el padre: S1–S5 aceptadas con alcance limitado sobre C4 `021f9e29404e243c268e84724648423349a26866`. Sin sourcefix ni aprobación nativa. Véase L10.
- **T5 [S1–S5]** — in_progress — documentación raíz/contrato histórico/espejo actualizados y handoff01 IMPLEMENTED por el padre; pendientes su comprobación documental, parada SOLO preview job5/4201, salud final DEV4200/API8080/DB55432 y commit local C5 en la misma rama. No limpieza ni commit final acreditados. Sin push/PR/merge.

## Log

### L1 — Pedido original

1. Has que estas opciones siempre esten aplicada (No coloques un slide para ellos)
Eliminar espacios al inicio y al final
Tratar NULL y N/A como vacíos (sin distinguir mayúsculas)
Fechas Darwin Core
Coordenadas decimales
Valores numéricos Darwin Core
Comprobar duplicados
2. Solamente muestra los datos-filas que han tenido cambios
3. Dale la opcion al usuario de mostrar todos los datos
4. manten la opcion de ocultar columnas sin datos
5. Elimina tanto texto dentro de la interfaz, recurre a los skills de ui/ux y de diseño para tomar estas deciciones y mejora la interfaz.

### L2 — Alcance y exploración inicial

Solicitud nueva sustituye opt-in de las seis reglas en Normalizar; no reabrir ni modificar especificación histórica cerrada. HEAD505d60d/árbol sin cambios salvo.env.example preexistente, intocable. Nueva rama derivada de ese corte. No alterar backend/esquema/configuración global/catálogo ni enviar archivos/nombres/celdas/filas al servidor.

Interpretación acotada: las seis reglas estarán siempre activas en preview y Aplicar de Normalizar. El primer diagnóstico continúa usando originales; Aplicar sigue explícito. Se mantienen modos seguros iniciales para fechas/separadores ambiguos, con elección explícita DMY/MDY/coma; IDs/case/ceros/precisión/textos originales preservados. No cambiar defaults de helpers compartidos que usa validación cruda. Ambos duplicados siguen avisos diferenciados sobre TODOS los registros, sin eliminación/fusión.

«Filas que han tenido cambios» significa algún valor normalizado distinto del original en CUALQUIER columna, incluso oculta/fuera de ventana. Un aviso de duplicado sin cambio de valor no convierte la fila en modificada. Se mantienen avisos/conteos globales aunque vista Con cambios esté vacía; Todos permite acceder al conjunto entero. Ocultar columnas solo modifica presentación, no igualdad, datos ni diagnóstico. Filtrar vistas reinicia página y nunca recalcula normalización/reenvía originales; filas y columnas conservan índices físicos.

Explorador mw4oce71 readonly: snapshot ya compara after!==before y cuenta changedRows, paginación usa posiciones originales; añadir índice de posiciones modificadas en el cálculo y rowFilter opcional all|changed al window(defaultall conserva consumidores). Filtrar materialización fuera del hilo UI, validar offset contra tamaño filtrado y guardar filtro en ventana confirmada; []columnas conserva filas físicas. Guardia latest/pageId y diagnósticos deben conservarse. Metadata actual totalRows/changedRows basta sin enviar índice al main thread. engine/analysis.worker.ts y required-fields.ts no cambian defaults. Reporte de exploración no es prueba funcional.

Dirección UX recomendada: hoja protagonista y barra compacta «Con cambios»/«Todos», «Ocultar columnas vacías», «Formatos y reglas» en disclosure; conteo breve y duplicados compactos/desplegables. Vacío honesto «Sin cambios» con acceso a Todos. Selects nativos/modos explícitos, objetivo44px/Escape/foco/touch/reduced-motion y ensanche SOLO Normalizar conservados. No nueva paleta/font/dependencias ni rediseño de otras pantallas.

Skills leídos: gentle-design y ui-ux-pro-max. gentle_design list confirma design/system.md actualizado respecto a tokens; canvas apagado. Iteración dirigida del artboard elegido01-hoja-ancha (producción ya implementada), no reescribir alternativas02/03. Nueva fuente estable para workers es este documento. Pruebas existentes de switches/defaults OFF se actualizan por cambio solicitado manteniendo cobertura de comportamientos no afectados; nunca borrar/comprimir tests por límite de líneas.

Riesgo real:item4 por filtro/paginación/carreras en worker/estado. Unidades dependientes T2→T3, no escritores paralelos. Pruebas RED/GREEN focales por regla y un seam frontend final; independiente sobre cambio nuevo sin repetir feature anterior intacta. Config backend/Docker/depósitos/dotenv no son superficies de edición. Auditoría npm pendiente aceptada, warningbundle y falta de aprobación nativa históricos no se presentan como resueltos ni pruebas nuevas. Estrategia ask-on-risk: previsión supera400, consultar forma de entrega antes del próximo commit; elección no autoriza publicación.

### L3 — Diseño comprobado; entrega pendiente de elección humana

Diseñador mw4om8tk completó únicamente el diseño T1 [S1–S5]. El padre inspeccionó el nuevo contrato, manifest y resultados estructurales y aceptó `design/normalization-live-preview/simplification-contract.md` como contrato autoritativo de esta evolución para implementación, subordinado a Specs. Artboard01 iterado: barra compacta Con cambios/Todos, seis reglas fijas sin interruptores, formatos en disclosure y fixture de36filas con tres modificadas y pareja duplicada sin cambios. Manifest enlaza esta tarea; alternativas02/03 permanecen históricas, sin cambios.

Fuente UX de la búsqueda real registrada en el contrato: `python3 -B /home/dark/.agents/skills/ui-ux-pro-max/scripts/search.py 'progressive disclosure data tables' --domain ux`; resultado `ux-guidelines.csv`, Responsive / Table Handling / Web: contener tablas anchas con scroll horizontal, no desbordar viewport. No atribuir disclosure a ese resultado; responde a S5 y Forms & Feedback.

Evidencia: `.browser/normalization-simplification/design/structural-results.json` y `.browser/normalization-simplification/design/parent-check.json`. El padre ejecutó un único spotcheck: node --check exit0, recursos contenidos, un único interruptor de presentación hide y alternativas02/03 intactas. Las comprobaciones estructurales del diseñador no son prueba funcional Angular, medición geométrica ni validación nueva de navegador.

Canvas abierto por el padre con gentle_design: http://127.0.0.1:45433/EutamAsBvDyy4XhZlZSAci2yFYbbNAYb/d/normalization-live-preview/ . `xdg-open` falló con ENOENT solo al intentar apertura automática; URL disponible para apertura manual. ASSESS de diseño: medium; revisión nativa no evaluable por archivos untracked, sin revisión independiente, reviewDue y START ofrecido; no hay aprobación.

T1 queda bloqueado SOLO por elección humana de estrategia de entrega antes del primer commit: previsión650–950>400, ask-on-risk sin cambios. El padre formulará una vez la primera pregunta de forma de entrega al recibir este registro; no se inventa estrategia. Iteración actual sin commit; T1 no termina hasta su commit. T2–T5 siguen pendientes, sin iniciar ni escrituras de código fuente; su orden interno no se registra como bloqueo. Sin publicación, PR, push ni merge.

### L4 — Estrategia elegida y única pasada de cortes

Elección humana literal del menú ordenado: «Cadena sobre la rama principal», valor `stacked-to-main`. Tokens vigentes: delivery_strategy `auto-chain`, chain_strategy `stacked-to-main`, destino `main`. Resuelta la condición humana de L3; T1 vuelve a in_progress, listo para primer commit pendiente. T2–T5 continúan pending, sin iniciar. No más preguntas de estrategia; no se autoriza publicación.

El padre verificó el default registrado localmente: `git symbolic-ref refs/remotes/origin/HEAD` => `refs/remotes/origin/main`; `main` local = `origin/main` = `17ce991dc8c57ca59a5c6a95ec74c6a539872c0e`. No se afirma consulta remota reciente. La base de esta evolución `505d60d` está20commits LOCALES por delante, correspondientes a funcionalidades anteriores CERRADAS. Revisar solo deltas `505d60d..nuevo trabajo`; nunca incluir esos20commits en la revisión de unidades nuevas, publicar trabajo antiguo ni hacer merge/rebase/reset de main. Antes de futuros PR dirigidos a main, la base previamente construida505 debe integrarse o recibir disposición explícita: prerrequisito de publicación, no bloqueo de implementación ni autorización actual.

Única pasada honesta de cortes ANTES de implementación; previsión650–950 es hipótesis, running0, contar líneas reales solo cuando se observen:

- **C1**: diseño + especificación/contrato, rama actual `feat/normalization-simplification`, base `505d60d`.
- **C2**: ventanas filtradas del worker + pruebas/documentación, rama prevista `feat/normalization-changed-rows`, depende de C1; T2, Risk:item4, commit propio.
- **C3**: reglas fijas SOLO Normalizar, validación cruda intacta + pruebas/documentación, rama prevista `feat/normalization-fixed-rules`, depende de C2; parte de T3.
- **C4**: estado/UI de revisión compacta de cambios + pruebas/documentación, rama prevista `feat/normalization-changes-review`, depende de C3; parte de T3, Risk:item4, commit propio.
- **C5**: aceptación/documentación raíz/seguimiento, sobre la última rama, depende de C4; T4/T5.

C3/C4 son dependientes, sin escritores paralelos. T3 puede abarcar C3+C4; no crear tareas por satisfacer conteos. Objetivo aproximado400líneas orientativo: no comprimir ni borrar cobertura anterior; tras esta única pasada, informar sobrepasos cohesivos en vez de subdividir indefinidamente. El padre conserva creación de ramas y commits. Sin PR público, tracker ni ChainContext porque publicación no autorizada; sin push/merge. L1–L3 conservan su carácter histórico, incluido el bloqueo ya resuelto.

### L5 — C1 observado; inicio de C2

El padre observó el commit C1 `fc4f4224b88ebe6ec8e09ff2a695bbcc599bef43`:4archivos,296adiciones y25eliminaciones =321líneas autorales. Comprobaciones JS/estructura/diff exit0 observadas por el padre; evidencia estructural y spotcheck en `.browser/normalization-simplification/design/structural-results.json` y `.browser/normalization-simplification/design/parent-check.json` (L3). T1 done corresponde únicamente a preparación de diseño/especificación/contrato, no a UI funcional productiva ni nueva aceptación de navegador.

Rango C1 de esta evolución: `505d60d..fc4f4224b88ebe6ec8e09ff2a695bbcc599bef43`. El padre creó la rama C2 `feat/normalization-changed-rows` desde C1; rango de la siguiente unidad: `fc4f4224b88ebe6ec8e09ff2a695bbcc599bef43..nuevo trabajo`, sin SHA nuevo todavía. T2 in_progress para el siguiente writer de filtrado de ventanas del motor; no se afirma ejecución de nuevas pruebas. T3–T5 pending.

Estrategia cacheada `auto-chain`/`stacked-to-main`, destino registrado `main`, sin nuevas preguntas ni publicación. Running observado321; previsión650–950 sigue siendo hipótesis. Base505 y dependencia de los20commits anteriores respecto a main sin cambios: excluirlos de revisión de unidades nuevas y mantener el prerrequisito futuro de publicación de L4, no bloqueo de implementación. Sin push/PR/merge.

### L6 — C2 implementado y comprobado; C3 iniciado

Writer mw55m8ud implementó `rowFilter` opcional `all|changed`, omitido equivale a all, sin propiedad nueva en la respuesta. Índices modificados cacheados durante el bucle existente; lectura pública de páginas conserva identidades físicas, considera cualquier columna y `[]`, y mantiene duplicados globales. Cambios en modelo, preview puro, dos specs de motor y `frontend/NORMALIZATION.md`. Worker y archivos de validación intactos: la guarda compartida existente lee el nuevo enum del modelo. Sin cambios al normalizador global, opciones compartidas, análisis crudo ni backend.

RED válido en `.browser/normalization-simplification/engine/red-public.log`: exit1,7fallos/100pasadas; GREEN en `.browser/normalization-simplification/engine/green.log`: exit0,107pruebas/4archivos, preservadas las99anteriores. El primer `.browser/normalization-simplification/engine/red.log` no observó el spy retenido por el bundler: representación del harness corregida ANTES de corregir fuente, no evidencia RED válida de esa aserción. `.browser/normalization-simplification/engine/architecture.log` y `.browser/normalization-simplification/engine/diff-check.log`: exit0. Pruebas públicas con getters/protocolo cubren ausencia de rescan/reinit y enum inválido sin alterar generación/cache. Offset>total ya se rechazaba; changed usa límite changedRows y offset==total da ventana vacía.

El padre leyó modelo/preview puro modificados y el log GREEN107 real; no duplicó ejecución focal ni ejecutó suite completa/navegador. Commit C2 observado `143d55985a8677942206c7c5c0da007198447b64`, rango `fc4f422..143d559`:5archivos,132adiciones+8eliminaciones=140líneas autorales, no143informadas por el writer. Running321+140=461; previsión650–950 aún hipótesis.

ASSESS high, agentEscalation4; revisión nativa no evaluable por untracked, sin aprobación. Independiente OBLIGATORIO pendiente en T4 sobre trabajo nuevo integrado; no sustituirlo por pruebas previas ni presentar T2 como aceptación UI. T2 done se limita a implementación y comprobaciones propias/públicas de S2/S3/S4.

El padre creó C3 `feat/normalization-fixed-rules` desde `143d559`; T3 in_progress para C3 y después C4 dependiente. C3 todavía no escrito: no declarar S1 completo. T4/T5 pending. Estrategia cacheada `auto-chain`/`stacked-to-main`, destino registrado main y dependencia de base505/20commits previos sin cambios; sin nuevas preguntas ni publicación.

### L7 — C3 observado; preparación de C4 y previsión revisada

El padre observó C3 `b787754d6452bbf921fcc1cdd3d03becd7904431`, rango `143d559..b787754`:8archivos,107adiciones+71eliminaciones=178líneas autorales. Running321+140+178=639. Creó C4 `feat/normalization-changes-review` desde b787754. Se revisa una vez la previsión a1000–1300 según unidades observadas y UI/pruebas/docs restantes; se conserva la única pasada honesta de cortes y estrategia cacheada `auto-chain`/`stacked-to-main`, sin nueva pregunta ni publicación.

Writer mw562ydi implementó seis reglas ON calculadas SOLO desde formatModes en Normalizar; sin controles/output de selección de reglas, solo selección de modos. Diagnóstico crudo conserva exactamente `{trim:false,emptyMarkers:false}`. Aplicar usa seis flags ON y retiene originales: resumen crudo1/4 → Aplicar4/4 → nuevo diagnóstico crudo1/4. C3 cubre S1; la UI sigue en Todos, no Con cambios todavía. No hay escritura C4 de fuente/estado de filtrado worker observada.

RED22fallos/37pasadas; primer GREEN3fallos/56pasadas conservado y no presentado como éxito inicial. Correcciones de expectativas: detalle ya abierto, duplicados ahora ON y orden update frente a page. GREEN final59/59 en3archivos (57anteriores adaptadas+2nuevas), sin casos borrados; arquitectura/diff exit0. El padre leyó TS/HTML/evolución y `.browser/normalization-simplification/fixed-rules/evidence.md`. ASSESS medium, nativa no evaluable/sin aprobación; C3 no requiere independiente nuevo por núcleo concurrente intacto, pero independiente integrado T4 sigue OBLIGATORIO por item4 de C2/C4. No es aceptación C4 ni cierre de feature.

Siguiente C4: Con cambios por defecto/Todos, filtro visual/paginación con ventana confirmada y guardas latest; formatos y reglas compactos en disclosure, duplicados globales incluso con vista vacía, hideEmpty visual. Preservar política de modos, Aplicar explícito y diagnóstico crudo. T3 continúa in_progress; T2 done y T4/T5 pending.

Refinamiento menor S5 aprobado por el padre: valores de tabla literales planos, sin glifo de espacios no soportado en cada espacio ordinario; badge de regla y detalle antes/después exacto, visualizador de espacios solo en panel de originales. Solo presentación, sin mutar snapshot/reglas/datos ni introducir fuente/paleta nuevas; refinamiento ordinario de implementación del diseño.

### L8 — C4 observado; aceptación integrada pendiente

Writer mw56kuan implementó estado/template compacto S2–S5 preservando S1 de C3: rowFilter solicitado por defecto changed separado de filas/rango de ventana CONFIRMADA, tokens PAGE solo de vista y misma generación, sin reinit/update/cancelación del análisis. Sin cambios al motor/protocolo/modelo, flags C3 ni diagnóstico crudo. Vacío Sin cambios y CTA con foco a Todos, duplicados globales/cache/metadata de columnas completas, cambios solo en columnas ocultas y `[]` preservados; formatos/reglas cerrados al entrar, tabla literal after+badges y original exacto, hide con objetivo44px y reduced-motion.

Evidencia `.browser/normalization-simplification/compact-review/`: `red.log` conserva fallo técnico inicial de compilación it.each; `red-public.log` registra RED público16fallos/54pasadas. `green.log` conserva70pasadas/1fallo CSS por comillas retiradas; matcher de igual semántica corregido, `green-correction.log` final71/3archivos exit0 (59C3+11DOM+1CSS). `architecture.log` y `diff-check.log` exit0; detalle en `evidence.md`. El padre leyó estado FULL/template FULL y evidencia; sin duplicar focal ni afirmar geometría.

Commit C4 observado `021f9e29404e243c268e84724648423349a26866`, rango `b787754..021f9e2`:9archivos,307adiciones+44eliminaciones=351líneas autorales; running639+351=990, previsión1000–1300. Rama `feat/normalization-changes-review` se mantiene para C5/documentación final. ASSESS high, escalación item4; nativa no evaluable por untracked, candidate null, sin aprobación. Independiente integrado T4 OBLIGATORIO para trabajo nuevo C2/C4, no sustituible por prueba antigua. T3 done solo implementación/comprobaciones públicas/lectura del padre; T4 in_progress con independiente, seam y navegador aún no ejecutados; T5 pending.

El padre registró gentle_design implement/handoff in_progress de01, nueva especificación de esta evolución y preview4200: artboard como especificación visual traducida a controles nativos, no HTML copiado;02/03 siguen alternativas históricas. Metadata del handoff cambiada sin commit, propiedad del padre para C5; no certifica aceptación implementada nueva ni reabre tarea histórica. Estrategia cacheada `auto-chain`/`stacked-to-main`, main registrado, sin más elecciones ni publicación;20commits previos a base505 fuera de revisión nueva, prerrequisito futuro de publicación intacto.

### L9 — Independiente y seam observados; fixtures preparados, navegador pendiente

Evidencia auténtica independiente mw578dwh-d-tdoq preservada por el padre en `.browser/normalization-simplification/independent/result.md`, candidato `021f9e29404e243c268e84724648423349a26866`, rango fc4f422..021f9e2: **178pruebas/7archivos existentes PASS exit0**, **5pruebas OWN PASS exit0** y puente **worker_threads REAL PASS exit0**. Los seis JSON OWN1–OWN6 del documento son evidencia recibida, no reconstrucción de raw temporal ni pruebas ejecutadas por este preparador. S1–S4 comprobados en adapter/protocolo/DOM; S5 DOM comprobado, geometría de navegador fuera de ese alcance. Sin bloqueadores de producto reproducidos en el independiente, sin sourcefix y fuente HEAD021 sin cambios según evidencia del padre.

Se conservan incidentes del harness: OWN primero4PASS/1FAIL por expectativa [0] frente a primeras50columnas, corregida antes de5PASS; puente primeroexit1 por colisión esbuild sourcefile/salida, corregida renombrando solo sourcefile antes del thread real PASS. No atribuirlos al producto ni presentar la primera ejecución como exitosa. No recuperar ni limpiar scratch externo. No son aprobación nativa, aceptación visual, auditoría exhaustiva ni benchmark nuevo.

Seam NUEVO del padre job4 terminado exit0: lectura de `.browser/normalization-simplification/seam/results.json` sin modificarlo confirma checker arquitectura, suite serial y build exit0. `suite.stdout` confirma el conteo real **225pruebas/15archivos PASS**; `build.stdout` confirma build y salida `frontend/dist/frontend`. `build.stderr` conserva advertencia: bundle inicial **649.97kB**, presupuesto **500.00kB**, exceso **149.97kB**. Se constató `frontend/dist/frontend/3rdpartylicenses.txt`; el padre informó comprobación de licencias exit0. Son resultados del padre, no reejecución de este preparador ni suma de178+5 al total225.

Preparación acotada en `.browser/normalization-simplification/e2e/`: `generate_fixtures.py`, `sparse-120x70.csv` (56661bytes), `unchanged-12x70.csv` (6289bytes), `empty-1x500.csv` (6500bytes) y `manifest.json`. Generador ejecutado con `python3 -B`, sin importar motor ni consultar API. Baseline exclusivo: fixture propio conocido `.browser/normalization-live-preview/e2e/normalization-live-52.csv`; contiene **34cabeceras**, no30, preservadas y ampliadas a70. Canonicalización y goldens MANUALES; baseline no comprobado contra motor/configuración/catálogo público, no alterar silenciosamente goldens ante cambios adicionales. Cabecera literal `Fecha original` conservada, mapeo público obligatorio a `eventDate` (índice12), sin clave extra accidental. CSV UTF-8 mediante csv.writer/LF, localidad con LF interno; sourceRow calculado contando LF realmente emitidos.

Goldens120: safe inicial4cambios índices0/10/24/55, físicos2/22/50/112; coma explícita6 añadiendo75/90, físicos152/182; coma+DMY7 añadiendo110, físico222. Los120índices físicos2,4,…,240 y hashes/tamaños/mapa de columnas constan en manifest. Pareja idéntica5/100 sin cambios (físicos12/202):1grupo/2afectadas full y1grupo/2afectadas ID, global antes/después y en cualquier vista; IDs literales0001/1/ABC/abc conservados. Columna60 vacía tras trim no elimina fila55 modificada; columna69 solo tiene dato en fila117 sin cambios (físico236) y debe persistir al ocultar vacías calculadas sobre TODOS. Coma conserva precisión de cantidad12.340000000000000000001 y coordenada2.444000; fecha ambigua solo cambia con DMY explícito. Originales intactos.

Goldens12canónicas:0cambios/Todos12, pareja2/10 idéntica sin cambios,1grupo/2afectadas full e ID, último físico24. Goldens500columnas/1fila sin ID: todo original ` \t `,1fila cambiada, todos normalizados vacíos; ocultar produce columnIndices[] conservando fila física2 y restaurar devuelve ventana50. Todos los archivos bajo10MiB y máximo500columnas; sin benchmark12k ni pesca de cancelación.

`vite-preview.config.mjs` preparado con root absoluto frontend, envDir propio vacío `e2e/empty-environment/`, outDir dist/frontend/browser, preview127.0.0.1:4201 strictPort y proxy/api a127.0.0.1:8080. Solo configuración/datos: NO se inició preview, navegador ni servicios; NO se ejecutaron suites/checkers/build nuevos, ni GET/PUT/POST. Browser **NOT RUN**: geometría, escritorio/móvil, teclado, mapeo público, descargas y HAR siguen pendientes del padre. T4 continúa in_progress; T5 pending. No T4done, handoff implementado ni aprobación nativa; sin requisitos S# nuevos ni cambios de producción/documentación raíz/diseño por este preparador.

### L10 — S1–S5 aceptadas con evidencia combinada; cierre documental en curso

El padre aceptó las cinco Specs tras independiente integrado, seam y QA real sobre C4 `021f9e29404e243c268e84724648423349a26866`, sin cambios de fuente. T4 done; T3 done intacto. Evidencia independiente mw578dwh en `.browser/normalization-simplification/independent/result.md`:178/7existentes PASS,5OWN PASS y worker_threads REAL PASS, seis JSON auténticos preservados. Sus dos fallos iniciales de harness (ventana esperada [0] frente a50columnas y colisión esbuild sourcefile/salida) se corrigieron sin sourcefix, no se ocultan ni prueban defectos del producto. Scratch externo no recuperado ni eliminado.

Seam del padre `.browser/normalization-simplification/seam/results.json`:225pruebas/15archivos PASS, checker/buildexit0 y3rdpartylicenses preservada; bundle649.97kB/500.00kB, exceso149.97kB. C2GREEN107, C3GREEN59 y C4GREEN71 son cortes independientes, NO se suman con225ni con178+5. RED/errores técnicos y correcciones anteriores siguen en L6–L9. Sin nuevas pruebas backend ni auditoría npm: pendiente aceptada, repetición prohibida.

QA real mw588jkj comprobó núcleo S1–S5: fixture EXACTO120filas/70columnas; default4cambios físicos2/22/50/112; coma6añade152/182; DMY7añade222. Todos120, páginas10/25/50/100, última20hasta físico240; IDs0001/1/ABC/abc intactos. Seis reglas fijas sin switches (solo hide), formatos/duplicados cerrados al entrar, Con cambios por defecto. Columna60 oculta conserva fila112 modificada; columna69 poblada solo en fila236 sin cambios sigue visible: metadata de TODOS. Fixture12con0cambios:0–0de0, avisos globales1grupo/2afectadas full y1grupo/2afectadas ID, CTAfocoTodos/últimafísica24. Fixture500: fila2con0celdas al ocultar/restaurar50. Valores literales planos; visualizador de espacios solo en detalle original.

Escritorio1440×900 primera fila top786.22/bottom858.47;1920top772.22. Móvil390sin overflow documental, scroll interno1838/340 y cabecera/fila física sticky. Controles44px, hide44×24/thumb16/checked20/reduce0s; Escape externo/interno, flechas y Tab observados. Reporte inicial PARTIAL porque cinco comprobaciones auxiliares quedaron SIN EJECUTAR, no defectos de producto ni prueba agotada/indisponible. Espera25s por condición errónea «Resumen» tras Aplicar retenida como incidente de automatización: Aplicar permanece en Normalizar, no timeout ambiental/EAGAIN. Incidentes de selector del harness no se atribuyen al producto.

Continuación mw58prll ejecutó SOLO las cinco pendientes, `.browser/normalization-simplification/e2e/qa/remaining/report.json` completed/A–EPASS: (A) filtro real visible0incidencias, descargas JSONCSV42COMPLETAS con cada uno de seis campos iguales,2avisos full+2ID físicos12/202/contextosystem/rev0; (B) CLICCerrar restaura foco2:9/panelcerrado/sin reapertura inmediata; (C) thumb normal asentado20/.12s; (D) navegación de500columnas DOM específica169.44×44/170.03×44, ambos botones en viewport; (E) ayuda Sin occurrenceID VISIBLE. Sin sourcefix, nueva revisión general ni incidente nuevo.

HARprincipal31GET y suplemento21GET son sesiones SEPARADAS, no una sesión agregada; suplemento añadió2GETdirectos posteriores de metadatos. Configuración/catálogo antes/después byteidénticos, hashes de fuentes intactos; cero solicitudes biológicas/POST/PUT/erroresconsola, sesiones cerradas. No confundir workerstatus0 con HTTPsuccess. Raw bajo `.browser/normalization-simplification/e2e/qa/` y `qa/remaining/`; fixtures/manifest en e2e. Padre leyó ambos reportes/análisis/F1/cinco resultados, comparó42CSVJSON/todosloscampos y HAR31/21porseparado, abrió2PNG representativos1440default+móvilformatos, confirmó físicos4/6/7/Todos120/última240/sin cuerposPOST y escribió `qa/parent-contrast.json`. Evidencia delegada contrastada, no repetición propia de cada interacción.

Aceptación S1–S5 acotada: NO certificación ISO/a11y exhaustiva/benchmark25millones/nueva prueba de cadaCLI; backend antiguo no reejecutado. NativeASSESShigh/agentEscalation4 no evaluable por untracked/candidatenull, sin aprobación nativa, reviewDue ni START ofrecidos. Independiente nuevo completado no equivale a aprobación nativa. Limitaciones históricas npm/bundle/cachés privados/captura externa conservadas; ningún bypass dotenv/.env.example.

T5 in_progress: README/AGENTS/VERIFICATION y aviso histórico en contract.md actualizados; contrato autoritativo sigue simplification-contract.md. Handoff01 NUEVO IMPLEMENTED/preview4200 ya registrado por el padre,02/03 históricos intactos. Pendientes SOLO comprobación documental del padre, detener preview propiojob5/4201, salud final de DEVjob2/4200+APIjob1/8080+DB55432 y commit local C5. Estos servicios siguen activos según último reporte; no afirmar limpieza ni salud final observadas. No tocar scratch externo ni prometer limpiar cachés. Este cierre pasivo no ejecuta tests, navegadores ni servicios; RED/GREEN no aplicable a documentación.

Cadena local C1fc4f422(321) → C2143d559(140) → C3b787754(178) → C4021f9e2(351) → C5pendiente en feat/normalization-changes-review; running990+C5sin total final ni SHA inventado. Estrategia cacheada auto-chain/stacked-to-main hacia main LOCALregistrado17ce991dc8c57ca59a5c6a95ec74c6a539872c0e. Base505d60d/20commits anteriores cerrados fuera de nueva revisión; integración o disposición explícita antes de publicación futura, sin autorización de integración vieja ni bloqueo de implementación. Sin push/PR/merge. Espejo canónico: topic odd/normalization-simplification/tasks con texto COMPLETO; topic erróneo odd/tasks/normalization-simplification.md permanece intacto.
