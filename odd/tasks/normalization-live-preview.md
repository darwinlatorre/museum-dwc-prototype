# Normalización interactiva y vista completa de registros
Vista local reversible, formatos DwC y dos clases de duplicados; conservar originales y el sistema visual existente.
Rama: `feat/normalization-live-preview`, base `29eff9819830f4618592a53ed986f5008eb5ce40`. Commits locales por unidad; sin publicación. Verificación frontend focalizada y un seamcheck suite/build final.

## Specs

1. **S1**: «(Para todos estos cambios verifica UX-UI y Sistemas de diseño, para aplicar esto intenta dividir la tarea en distintos agentes)»
2. **S2**: «En la normalizacion quiero que se pueda ver toda la lista de datos (Verifica cual es la UI/UX mas pertinente para mostrar todo, si es necesario has que la caja de main se extienda a los lados para mejorar la vista).»
3. **S3**: «Quiero que hayan botones dezlizantes, que se puedan marcar o descarcar donde si los marcas y desmarcas se vea en tiempo real como se estandarizan los datos del DwC en sus formatos correspondientes, fechas, coordenadas, valores numéricos y espacios en blanco. (Debe haber algo que distinga los cambios, es decir si se quita un espacio o cambia una fecha) Se debemostrar al colocar el mouse encima de un dato cual era el dato anterior.»
4. **S4**: «Entre las opciones, valida duplicados.»
5. **S5**: «Para las columnas que no tienen datos, se puede decirdir no mostrarlas.»
6. **S6**: «Ideal: Respetar los tipos de datos y las recomendaciones de Darwin Core.»
7. **S7**: Elección humana: «Filas completas iguales (recomendado)».
8. **S8**: Corrección posterior: «Pero tambien concidera un duplicado si tienen el mismo ocurrenceID.»

## Tasks

- **T1 [S1,S2,S3,S4,S5,S6,S7,S8]** — done — agenteUX mvtzgso6 produjo3direcciones/contrato; padre revisó y congeló contrato, eligió01hoja-ancha/abriócanvas/handoff. Estructura/paleta/sintaxis3JS yspotcheckpadrePASS, sinbrowserproductivo. Corte `:/define live normalization preview`, sin nueva paleta/dependencias/API.
- **T2 [S3,S4,S6,S7,S8]** — in_progress — agente motor separado: contrato congelado en design/normalization-live-preview/contract.md; reglas por destino, dos avisos de duplicados también en validación, previewpersistente con ventanas/columnIndices y compatibilidad. RED/GREEN focalizado y docs de reglas; Risk:item3 helpers/validador eitem4 worker. Commit pendiente; no fuente productiva escrita aún al registrar.
- **T3 [S1,S2,S3,S4,S5,S7,S8]** — pending — agente UI: controles deslizantes, tabla completa navegable y original accesible, ocultación visual, ancho condicionado a Normalizar e integración del contrato. Depende T1/T2; sin escritores concurrentes sobre workbench/protocolo. RED/GREEN focalizado, docs frontend. Risk:item4 generaciones, preservar guardas/estado. Commit pendiente.
- **T4 [S1,S2,S3,S4,S5,S6,S7,S8]** — pending — padre seamcheck suite/build/checker y contraste real navegador con agente acotado; verificador independiente item3/4 al final. Todos los ejemplos públicos y originales/exports/tráfico local, desktop/móvil/teclado/foco/hover/toque. Sin repetir checks agotados o unavailable. Commit/evidencia pendiente.
- **T5 [S1,S2,S3,S4,S5,S6,S7,S8]** — pending — padre documentación raíz/handoff/log/espejo/commits y limpieza solo recursos propios de prueba; dejar desarrollo activo, reportar límites reales. Depende T4. Sin push/PR/merge. Commit pendiente.

## Log

### L1 — Pedido original

(Para todos estos cambios verifica UX-UI y Sistemas de diseño, para aplicar esto intenta dividir la tarea en distintos agentes)
En la normalizacion quiero que se pueda ver toda la lista de datos (Verifica cual es la UI/UX mas pertinente para mostrar todo, si es necesario has que la caja de main se extienda a los lados para mejorar la vista).
Quiero que hayan botones dezlizantes, que se puedan marcar o descarcar donde si los marcas y desmarcas se vea en tiempo real como se estandarizan los datos del DwC en sus formatos correspondientes, fechas, coordenadas, valores numéricos y espacios en blanco. (Debe haber algo que distinga los cambios, es decir si se quita un espacio o cambia una fecha) Se debemostrar al colocar el mouse encima de un dato cual era el dato anterior.
Entre las opciones, valida duplicados.
Para las columnas que no tienen datos, se puede decirdir no mostrarlas.
Ideal: Respetar los tipos de datos y las recomendaciones de Darwin Core.

### L2 — Decisiones humanas de duplicados

Respuesta inicial a criterio de duplicado: «Filas completas iguales (recomendado)».
Corrección literal posterior: «Pero tambien concidera un duplicado si tienen el mismo ocurrenceID.»

Regla efectiva: AMBOS criterios, con avisos distinguibles sobre la vista normalizada actual. Mismo occurrenceID no vacío aunque otras celdas difieran; no eliminar registros ni inventar/corregir identificadores. Clave oficial `occurrenceID`, resuelta por mapeo, preservando literalidad/case/ceros. Ocultar columnas solo cambia presentación, nunca igualdad de filas ni datos.

### L3 — Exploración y límites existentes

Explorador readonly `mvtynjoq-5-9m14`, padre spotcheck normalizer completo: solo trim y NULL/N/A opt-in; preview actual de los primeros20registros y paginador10 de cambios, no dataset completo. Dataset íntegro ya está en UI. Límites10MiB/50.000filas/500columnas/100.000incidencias; no ampliar slice al completo en main thread. Worker actual parse/validate, un worker por despacho, termina anterior y descarta generaciones viejas. Nueva preview requiere contrato explícito y trabajo fuera del hilo UI, sin carreras con validar/cancelar/cambiar archivo/mapeo/configuración. required-fields también usa normalizer sobre proyección1columna: conservar semántica y callers legados.

No hay duplicados de registros: solo rechazo de cabeceras/mapeos repetidos. Exportación existente JSON/CSV es de diagnósticos, no archivo biológico normalizado: no redefinirla ni agregar exportación no pedida. Copias reversibles y aplicación explícita a validación; originales inmutables, filas/columnas físicas y textos arbitrarios preservados. Nuevas conversiones solo por destino DwC, no por apariencia numérica de IDs. NULL/N/A siguen siendo datos salvo consentimiento vigente; blancos/solo espacios pueden ocultarse sin tocar valores/índices. Tooltip no puede depender solo de ratón: foco/toque/Escape y contraste no basado solo en color.

Angular21.2/PrimeNG21.1/CDK21.2 ya instalados; no nuevas dependencias. Sistema existente `design/system.md` actualizado,49tokens/9alias; no volver a generar paleta. Main posee max1500px desde1600: cualquier ensanche debe ser solo Normalizar, no catálogo/fuentes/otros pasos. Workbench debe seguir montado. DEVactual4200/8080/DB55432 activo; sin Guardar/PUT de configuración, sin dotenv/.env.example/caches privados. Navegador con fixture sintética y HAR, nunca servidor biológico. Suites backend no aplican si no se toca backend.

### L4 — Investigación oficial y ruta inicial

TDWG único vocabulario de autoridad: https://dwc.tdwg.org/list/ (versión observada2026-10-13, referencia http://rs.tdwg.org/dwc/doc/list/2026-10-13). Definitions/TermIRI normativos; notas/ejemplos recomendaciones, no inventar XSD/DataType de Type=Property/rdf_type. Fuente obtenida con fetch_content responseId `mvtyzw4n6oq2xr` y pasajes exactos buscados.

- eventDate: ISO8601-1:2019 recomendado; fecha-hora/intervalo y precisión parcial, no forzar YYYY-MM-DD ni inventar día/zona horaria.
- decimalLatitude/Longitude: grados decimales en datum declarado, ±90/±180 inclusivos. No reproyectar/inventar datum ni convertir DMS sin información suficiente.
- individualCount: cantidad de individuos, ejemplos0/1/25; sampleSizeValue numérico con unidad correspondiente. No convertir IDs o cadenas arbitrarias por heurística.
- measurementValue permite literales como UV-light además de14.5: no toda la categoría es numérica. Conservar precisión significativa, no redondear mediante Number ni adivinar separadores/fechas ambiguas.
- occurrenceID identifica Occurrence y no necesariamente un registro digital único: advertencia de repetición según pedido humano, no eliminación automática ni afirmar que toda repetición es error biológico.

Ruta: contrato primero, motor y UI en sesiones distintas con propiedad única de integración; no paralelizar piezas dependientes ni forzar escritores superpuestos. Agente UX producirá direcciones auto-contenidas, padre elegirá la pertinente según S2 y abrirá canvas. Task-size large por continuidad multietapa/contratos/evidencia; no por contar archivos. Nueva rama desde29eff98, sin publicar ni heredar autorización de PR de otra feature. Próximo: contrato/UX T1, luego motor T2 y UI T3.

### L5 — Diseño adoptado y contrato congelado

Agente `mvtzgso6-6-d1e0` completó T1 propositivo:36registros sintéticos accesibles,3direcciones bajo `design/normalization-live-preview/` ycontract.md. Padre leyó contrato/manifiesto/checker y reejecutó `python3 -B .browser/normalization-live-preview/design/check-static.py`:exit0,3Node--check0/paleta/fuente/IDs/recursoslocales/manifiestoPASS. Sin RED de comportamiento por ser diseño; no navegador/producto/capturas nuevas. ASSESSmedium/nativeunassessableporuntracked ysinindependiente/aprobación. No repetir ni reinterpretar como UX productiva.

Elegido `01-hoja-ancha.html`:tabla protagonista/controles compactos/paginación/scrollcontenido/originaltemporal;02/03 alternativas. Canvasabierto44661/d/normalization-live-preview, autoabrirfallóxdg-openausente(no producto). gentle_designimplementregistró elección/handoff, no código ni commit por sí solo. Producción se reportará in_progress recién enT3.

Padre congeló `design/normalization-live-preview/contract.md`:runtimepreview separado del analysisworker efímero, originalcacheado una vez, páginas sinnormalizarfull, tokenssesión/generación/id ycompute cooperativo; ventanas máx100×50 concolumnIndices fuente explícitos filtrados pormetadata, evitar falso vacío si primeras50columnas están ocultas. No crear millones de objetosChange/PreviewCell: metadata compacta/conteos ymaterialización porventana. No BioTanStack/cache/backend.

Adopción adicional dentroS3/S6:lista cerrada de fechasDwC comunes, cantidades/enteros ycoords, precisión/literalidad sinNumber-roundtrip; mode safe predeterminado, DMY/MDY/comadecimalsolo elección explícita. Ampliar soporteISOcomún deeventDate/consistenciaparcial para no rechazar fecha recomendada trasnormalizar, no prometer ISOcompleta. Duplicados advisorydiferenciados se agregan también alAplicar/diagnóstico preservando esquemaJSONCSV/limitincidencias; no descripciones de milesdemiembros repetidasporfila. UI usará comunicación explícita al shell paraensancharSOLO Normalizar visible, no :has frágil ni DOMimperativo. T2owner único motor/protocolos, luego T3UI/shell; no solapar.

Runner serial local existente confirmado `.browser/normalization/vitest.serial.config.mjs` (maxWorkers1/fileParallelismfalse, sin cambiar límites/aserciones); configuración de frontend-architecture no existe aquí y no se inventa. Toda evidencia que deba durar en `.browser/normalization-live-preview/`, porque TMPDIRsubagent se elimina alretornar. T2autorizaráfocales; suite/buildseam finalpadreT4. T1doneporpreparación comprobada, no aceptaciónS1–S8. T2in_progress, nuevas reglas aún no implementadas.
