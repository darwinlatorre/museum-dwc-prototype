# Normalización automática y revisión compacta de cambios
Seis reglas fijas en Normalizar; filas modificadas por defecto, vista completa opcional y ocultación visual de columnas vacías.
Rama `feat/normalization-simplification`, base `505d60d`; delivery_strategy `auto-chain`, chain_strategy `stacked-to-main`, destino `main`; previsión650–950líneas autorales/running0. Cortes locales coherentes, sin publicación; runner serial `.browser/normalization/vitest.serial.config.mjs`.

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

- **T1 [S1–S5]** — in_progress — condición humana resuelta en L4; diseño y contrato comprobados y aceptados por el padre para implementación (JS exit0/estructura exit0, evidencia L3). Listo para primer commit, aún pendiente; diseño completo no equivale a T1 terminado.
- **T2 [S2,S3,S4]** — pending — writer por context-backstop: índice de filas cambiadas cacheado en snapshot/ventana filtrada en worker, enum opcional compatible por defecto all, casos públicos RED/GREEN; no cambiar normalizer/validación cruda. Risk:item4 (páginas/calculaciones/generaciones). Commit propio pendiente.
- **T3 [S1–S5]** — pending — writer dependiente T2: seis reglas activas fijas SOLO Normalizar/Apply, filtro Con cambios/Todos, ocultación visual y UI con menos texto/formatos progresivos, pruebas públicas y docs frontend. Risk:item4 (estado y respuestas de vistas). Commit propio pendiente.
- **T4 [S1–S5]** — pending — independiente acotado por item4; padre suite/build/checker y navegador real con datos sintéticos, cambios dispersos/ocultos/cero cambios/duplicados intactos/vista completa, escritorio/móvil/teclado/metadata/HAR. Aceptación y commit pendientes.
- **T5 [S1–S5]** — pending — padre cierre README/AGENTS/VERIFICATION/contrato/handoff/espejo/commits locales; limpiar SOLO preview/sesión propios, dejar DEV4200/API8080/DB55432. Sin push/PR/merge.

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
