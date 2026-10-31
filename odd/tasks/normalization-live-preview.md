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

- **T1 [S1,S2,S3,S4,S5,S6,S7,S8]** — done — agenteUX mvtzgso6 produjo3direcciones/contrato; padre revisó y congeló contrato, eligió01hoja-ancha/abriócanvas/handoff. Estructura/paleta/sintaxis3JS yspotcheckpadrePASS, sinbrowserproductivo. Commit `e3a80b89cf7e07c49c638c4435e270a4737d0532`, sin nueva paleta/dependencias/API.
- **T2 [S3,S4,S6,S7,S8]** — done — `3aaa6c709a4c858a40a51fbb11331bbfbb99a0a7` + `11746334f056aef240d3132cd9416db1f96b6bfb`, RED26/71→GREEN99focal/checker/diferencial40iguales+7intencionales; padre99propiasPASS. Independiente mvu1mbby:5probesPASStrasuna correcciónharness y99indiepreviasPASS; padre2hashesigualescandidato. Risk3/4satisfechosparaENGINE, no UI/ISOcompleta/25Mbenchmark.
- **T3 [S1,S2,S3,S4,S5,S7,S8]** — done — agenteUI mvu285gg ycorrecciónacotada mvu2s2jb:53focalesGREEN/checker/diff0, padre53propias ydeslizantesCSSRED1→GREEN53. Hoja/workerstate/original/ocultación/shellcondicionado/docsfrontend implementados; motorintacto. Commit `7a2b2b6b82b6a585a1194f6d9cbc2e9762abba67`. Item4UIverificadoindependiente(L9); UXbrowserrevelóF1/F2/F3enT4(L10), noaprobaciónvisualaún.
- **T4 [S1,S2,S3,S4,S5,S6,S7,S8]** — done — commit `9d368fe` (6archivos/+83/-5), recheck real dirigido F1/F2/F3 y móvil PASS, contrastado por padre (L13). RED53PASS/4FAIL→GREEN57/57; suite203/15+build/arquitectura/diff0, licencias preservadas, aviso649.22kB/500kB. Los tres bloqueadores S1/S3 resueltos con evidencia acotada; aceptación previa L10 e independientes de motor/concurrencia intactos, no repetidos. Sin aprobación nativa ni certificación exhaustiva.
- **T5 [S1,S2,S3,S4,S5,S6,S7,S8]** — done — commit documental de aceptación `4d0cfe1` (6archivos/+151/-13);2enlaces Markdown relativos añadidos válidos, handoffIMPLEMENTED y comprobación estructural/diffexit0. SOLO preview propio4201job4 detenido/puertoCLOSED; API8080job2 y DEV4200job3 vivos con GETconfiguración/catálogo200, DB55432OPEN (L14). T1–T5done, sin push/PR/merge. El último commit de seguimiento corresponde al padre y aún no tiene SHA registrado.

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

### L6 — Motor comprobado y dos cortes revisables

Worker `mvu0n3oi-7-zuob` completó implementación T2, sin UI/servicios/backend: reglas por destino, proyección compartida, ISOcomún, dos duplicados yWARNINGalApply; originalcacheado/valores/máscarascompactas/metadata/page≤100×50 yworker persistente porlotes. REDválido26fallos/71PASS(trasRED21/70); intentoGREENfallócompilaciónTS4111/TS2352 yse corrigió sin quitar aserciones;97PASS ydoscasos adicionales llevaron a99/4archivos(60existentes+39nuevos). No afirmar que la compilación fallida era RED conductual.

Padre leyó reglas, fechas, detector, preview, worker, validator/parser y evidencia. Ejecución propia exacta desdefrontend conNG_BUILD_MAX_WORKERS1/GOMAXPROCS2/runner.browser/normalization/vitest.serial.config.mjs/include'engine/*.spec.ts':exit0/99PASS,3.288scompilación+1.28stests. Logsseparados `engine/parent-focused.{stdout,stderr,exit}`. CSV ya era rectangular porparser: revisión no demostró un defecto en ese punto. S1/S2/S5/UXproductiva siguen pendientes.

Checker/diffexit0delwriter; diferencialbasee3/current con47comparaciones,40idénticas+7intencionales,0regresiones; padreleyóartefacto real, no solo reporte:4ISOaceptadas,flagfecha mapeada,coma consentida yfallbackpropio detoString. No se repitió el diferencial. Rawstdout/stderr/exits en `.browser/normalization-live-preview/engine/differential-result.json`; scriptignorado, nogithistory enpruebasversionadas. Evidencia/guía frontend/NORMALIZATION.md, sin benchmark25Mposiciones; carreras12kfilasprobadas, no aceptación de navegador.

Cortes coherentes observados (no borrar/comprimir tests para400): `3aaa6c709a4c858a40a51fbb11331bbfbb99a0a7`462adiciones/29bajas reglas/modelos/previewpuro/tests; `11746334f056aef240d3132cd9416db1f96b6bfb`274adiciones/13bajas worker/Apply/tests/docs. Cachedcheck0ambos, env.exampleintocableúnicountracked. No publicación.

ASSESS conitem4alto/nativeunassessableporuntracked exige verificador independiente; sin aprobación nireviewDue/ofertaSTART. T2no se marca done hasta ese dictamen. Próximo verificador acotado a T2/S3,S4,S6,S7,S8 ycompatibilidad/carreras, sinChrome/backend/suitescompletas. La UI comienza después, usando contratoestable; sus propias carreras se verificarán una vez al final de su unidad, no repetir motor intacto.

### L7 — Verificador corregido, motor aceptado e inicio de UI

`mvu1h4ow-8-5rp9` devolvióPARTIAL:99/99focalespropiasenclonaislado/exit0, pero0sondasporSyntaxErrorharnessCommonJS `const exports`; consulta alpadre agotóespera. No defectoproductoreproducido ni retry silencioso. Usuario: «Review the delivered subagent output and continue.» Padre autorizó UNAcorrecciónlexicalexports→moduleNames+referencia yprimeraejecuciónefectivadelmismoprograma, sin99rerun/assert/timeouthikes/nuevoscasos.

Continuación `mvu1mbby-9-jozm`:5probesPASS/exit0/stderrvacío,S3/S4/S6/S7/S8ENGINEPASS;originales/proyección/precision/modos/ISOcomún,500cols/gettersnorescan/XLSXsparse,IDs/filas/hidden/offpage ycap100kcon50kregistros;worker_threadsREAL/puentepostMessage latest/cancel/snapshot/error/cache. Cambiosdesesión/errorinit quedaron en99previas, no nuevosprobes. Nobenchmark25M/nobrowser/fullsuite/build/certificaciónISO. AyudaYYYY-MM-DDadvisory,noiniciarotracorrección.

Padre preservó salida auténtica resumida yJSON5probes en `.browser/normalization-live-preview/independent-engine/result.md`, no archivooriginalrehallado. Verificó hashesactualesWorker4e1e3699e41c788094a63fe20123cd3de23a2f00c4da176a115bce17cc345a4d ysnapshot7e5293c653fd5f3de1b0e95736baa4d4383ff0cecc592740ae0901305ed4bbd6 coincidentes, parent-hashes.json. Scriptf4a4c...reportadoporrole,no prometerrecoveryscratch. Propuesta2testsdelprimerPARTIALnoejecutada/nofalsaaprobación. No repetirprobes ni verificaciónmotorintacto.

T2doneporimplementación/propiaspruebas/independiente/contrasteobservados; no aprobaciónnativa. T3in_progressparaagenteUIseparado; hostmarcaráhandoffin_progressconpreview4200. No códigoUI aún alregistrar. AppsDEV2/4encendidos, sinAPIwrites/env/backend/deps. Próximo: implementarcontrato/presentación, focalesUIconTDD, luego seam+build+navegador/independienteUIenT4.

### L8 — UI integrada, entrega parcial corregida y deslizantes reales

Worker `mvu285gg-a-es26` implementócontroladorlocalpersistente/hojaAngular/appshellcondicionado/docsfrontend, sinengine/protocol/backend/deps. REDválido2fallos/34PASS, luego33/45→44/45→47/48. Fallos de dobles porURLworkerempaquetada, montajeAppdefer/metadata yregexCSSencapsulado se conservaron; no GREENintegral niUIacceptanceenprimeraentrega. Detectóeffectqueunía options+context/cfg/terms conpreviewupdate innecesario.

Padreleyóreport/TS/layout/state: updatecalculaba antecadaeffecttrigger. ÚNICO batchcorrectivo `mvu2s2jb-b-8w3h` autorizado:REDpúblico5variantesctx/rev/cfg/disponibilidad/terms emitían2previewmessagesenvezde1; separóeffectsolooptionsdelinvalidateanalysis y normalizórepresentaciónCSSAngular/Sassmanteniendoassertsticky/overflow/44px/min36rem/gutter2rem. GREEN53/53(32workbench/14layout/7evolution),checker/diff0. Sinrepetirengine/wholeSuite/build/browser. Padrepropiafocal53exit0 observada; históricos no sesuman.

ContrasteS3delpadre encontróinputroleSwitch20pxcuadrados, nointerruptorvisualdeslizante. Completópresentaciónnativa contrack44×24/thumb16/translate20,tokens/foco/zonatáctillabel44 yreducedmotionexistente; no cambióchecked/eventos/motor. RED1assertCSSappearance:noneausente, luegoGREEN53/53deUI(incluyendoassertstrack/thumb)exit0. Reemplazoinicialnomatchporwhitespace no cambiónada;read exacto ypatchcorrecto. Raw `ui/{parent-focused,switch-red,switch-green}.*`, más `correction-{red,final,architecture,diff-check}.*`; mem164resumecorrecciónsinUXbrowserinventada.

T3modular:NormalizationPreviewState ycomponenteNormalizationPreview;metadata-onlyno recalcula,display-onlyno invalida análisis,latesttokens/guardas/wholeoptionssnapshotApply,archivo/mapeoreset,originalregiónocultable/hover-foco-toque-Escape/rovinggrid. Filas10/25/50/100 ycolumnasmax50;ocultarporindicesmetadata sin tocarigualdad/datos;bothdupcriteriadiferenciados. Mainnormalization-wideSOLOworkbenchvisiblepaso4desde1600, otrasvistas/sidebarmontadospreservados. Originalheader secundario soloaldiferir evita repetición, decisiónreversiblecontratoT1precisadopadre.

CorteUIcoherenteincluyeestado/vista/integración/tests/docs; no borrar/comprimirtestspara400. T3doneporimplementación+propiaspruebas/contraste; independienteitem4ygeometría/navegador/fullsuite/buildsonT4actualin_progress. ASSESShigh4/unassessableporuntracked,sinaprobación/reviewDue; no reviewnativa todavía. ServiciosDEV2/4/55432intactos, sinSave/PUT/dataBackend/dotenv/instalaciones.

### L9 — Independiente UI y seam productivo observado

`mvu3sewq-c-uvha` ejecutó4probespúblicospropiosNode/Angularsignals/FakeWorker: initúnico/payloadpequeño/filafísica97-de31/últimapáginavigente,500columnas/índices[62,499]/[],reset-threadviejo-ready/page/error yretryINIT/opcionesactuales/cancel/errornoready. Exit0/originalesJSONiguales. Primerafocalexactaexit127ngnotfound,0testsefectivos porcontradicciónhandoffpadre:no-copydepsvscontratosuperiorreadonlyno-symlinkworkspace. Consultaq1expiró/replytardíounavailable,nosilenciarerror.

PadreautorizóUNAcorreccióndeSETUPacotada:copiarSOLOfrontend/node_modulesinstaladoaownscratch/tmp/independent-ui-z5tSEi/work/frontend/node_modules,excluyendo.env*/configs/caches,sinred/instalar/symlinkalworkspace. Continuación`mvu3zi92-d-hwtn`validó41linksinternos/exit0;primeraejecuciónefectivamismofocal53/3archivosPASSexit0,nostderrerror(solamentenpmnotice)/no4probesrerun/assert/timeouthikes. Independiente4UIcubierto enadapter/TestBed,noaprobaciónvisual/globalT4. `.browser/normalization-live-preview/independent-ui/result.md`preservasalidaliteral/resultado;notrawtemporalficticio.

Padrejob8SERIALNG_BUILD_MAX_WORKERS1/GOMAXPROCS2: checkerexit0,suitecompleta199/15PASS,buildexit0/3rdpartylicensespreservada. Warning649.04kB/500(149.04exceso),sinpresupuestocambiado/npmAudit/backendtests. Evidencia.seam/{architecture,suite,build}.{stdout,stderr,exit}/results.json. PreviewproductivoVitejob9:4201/envDirempty/APIproxyreadonly8080/strictPort,HTTP200config5fuentesen4201/8080/4200. DEV2/4/DB55432intactos.

Fixturesclientlocalprepared:e2e/52×34CSVconLF/filasfísicas2..104,aliasFechaoriginal→eventDate,ambigua03/04/2024fila22,precisiónliteralcomacoords/cantidad,IDsconcase/ceros,full[2,54]/ID[2,54]&[4,56],blankOptional/NULL;otros500columnasconlastvalue/allwhitespace;grande12000×1006.409.244bytesopcional. Ningúnarchivoalbackend/nuevasdependencias.

### L10 — Primera aceptación real y batch correctivo único F1/F2/F3

AgenteQA`mvu4o1xq-e-n5ir`,sesiónpropia`normalization-live-accept-7a2`cerrada,source/serviciosintactos. Browser1920×1080+390×844;52registros/34columnas/páginas10/25/50/100últimafísica104;mapeopúblicoFechaoriginal→eventDate;ambigua22safeoriginal/DMY2024-04-03/MDY2024-03-04/restauróDMY. ComaEXPLÍCITA2.444000/-76.614000/+00012.340000000000000000001;IDs0001/1/ABC/abcintactos. TrimOFFrestaura/ONrecopia,marcadorNULLreversibleexplícito,416celdas52registros. Dupsfull1grupo2registros/ID2grupos4registros,avisosnodelete. Hide34→32noalterafilas/dups;500encuentracol500,allhiddenconservafila2yrestore.

Apply0errores/8warnings(2full+4ID+2unknown),contextcollection/rev0;filtros0noafectanexportacionesJSON/CSV8/8idénticas. SPAretainarchivo/ctx/mapeocuandofuentes/catálogoreadonly. Main1630SOLOnormalizarvs1500otrasvistas. Móvilnodocumentoverflow390,inner1864/478conheader/rowsticky;originalx14..376/y542..830. Track44×24/thumb16/translate20,labels44+. HashCSVoriginaligual,console/errorsvacíos. Evidenciae2e/qa/report.json/HAR/snapshots/medidas/downloads+8PNGabiertosporQA,padreabrió3representativos. Padrecontrastóexportsrow[2,54]/[2,4,54,56]/rev0,cfgGETantes/despuésBYTEIGUALenparent-contrast.json. HARiniciódespuésnav:13GET/0POSTPUT;workerstatus0NOHTTPéxito. GETiniciales200enrequestslog,noharbodyinicial;noprometertrazacompletadebootstrap.

Fallosproductosobservados,reprospúblicos/medidas: **F1[S1,S3]**focoAplicar→hovercelda scientificName cambiada→Escape:originalno cierra(pordependenciadelkeydownchild). **F2[S1,S3]**setmedialightreduced-motion/media.matchestruepero7pseudoThumbtransition120ms:global*nocubrepseudo. **F3[S1]**column/page/navVerdiagnóstico35.56px,Aplicar/Finalizar34.19<44;labelswitchsí44+. UNbatchcorrectivo autorizado enT4: Escapevisiblecon focoexternoSINrobarfoco/restaurarcuandointerno/sinreabrir/guardactivo;reduceMotionpseudoSCOPED;min44botoneshoja+footerSOLOnormalización(otrasvistasintactas),testsRED/GREENpúblicos. No cambiarfonts/paleta/select/motor/protocol/worker/config/backend,niampliaraotrasvistas/sharedprimitive. RebuildydespuésrecheckDIRIGIDOSOLOF1/F2/F3/móviloverflow;nootrabarrida/verificaciónenginegeneral.

Límitesnoocultados:nocertificacióntodascombinacionesOFF/ON(matrixexhaustiva),rovingexactodireccional/foco-contrasteexhaustivo/originalesgigantesnotmedidos,glifosespaciovisiblesbox-likeenpartedePNGs(nodiagnósticofont),fixture12kopcionalnoutilizado,racesdeterministasyaindependientes. Dosclicksdisabledyrefviejosinacciónfueronautomatización/noproducto,notimeoutambiental/retryflujo. T4noDONEhastaúnicobatch/recheck;handoffnoimplemented,nativeunassessable/noapproval.

### L11 — Reanudación, correcciones comprobadas y decisión humana de runtime

Último pedido original, literal: «retoma, se quedo pausado el proceso.»

Incidente recuperado: writer `mvu5b07e` terminó «assistant reported an error» tras20llamadas, dejando6archivos/+83/-5. `mvwx55m0` reconcilió el RED ya válido (53PASS/4FAIL, compilación válida, exit1) y ejecutó SOLO el GREEN faltante:57/57PASS/exit0 (34workbench,16layout,7evolution), arquitectura/diffexit0. No se repitió RED ni se retiraron las53pruebas/aserciones previas; motor/estados/protocolo/opciones intactos. Evidencia propia: `.browser/normalization-live-preview/ui/t4-correction/report.md` y logs asociados.

Padre leyó código: F1 escucha Escape en documento con guardas de vista activa/región visible, conserva foco externo y restaura el interno; F2 desactiva movimiento del ::before scoped; F3 limita44px a botones de hoja y footer SOLO case4. F1/F2/F3 corregidos EN CÓDIGO, no nuevo PASS de navegador.

Nuevo seam corregido del padre, job1/exit0: suite frontend completa203/15archivosPASS, buildexit0 y3rdpartylicenses preservada. Evidencia `.browser/normalization-live-preview/seam-corrected/results.json` y logs; aviso649.22kB/500kB, política intacta. Los199del candidato anterior son evidencia histórica, NO el nuevo total ni una nueva ejecución. ASSESS fresco:medium/nativeunassessable por declaración untracked/candidate null; sin aprobación ni nueva independiente requerida para concurrencia intacta. Sin nativeinspect/start/reclaim ni acceso env.

Runtime observado por el padre:4200/8080/55432/4201CLOSED, sin jobs en segundo plano. Worker acotado `mvwxalpz`, SOLO lectura, confirmó contenedor propio exacto `universidad-normalization-dev-db`, postgres17-alpine, puerto local55432, volumen anónimo NO `postgres_data`, Exited255; JAR COPIADO SHA256 `9dfaf3dbd4520e9c050b2d21119f134c94c52728c224ddff4cc7747908282084` coincide. La evidencia pública no permite derivar usuario/contraseña ficticios ANTERIORES ni flags exactos. No adivinar: sin lecturas env/dotenv/cachés privados, arranque/reset/nuevaDB/SQL/migraciones. Runtime/GETpúblicos/recheckF1/F2/F3 NO ejecutados; positivos previos52filas/duplicados/exportaciones no repetidos.

Una única decisión humana pendiente: **restaurar manualmente la DB propia55432 y API8080 con su configuración anterior conocida, O proporcionar los parámetros FICTICIOS seguros conocidos necesarios para recuperarlas**. No se requieren ni deben compartirse credenciales reales; no ofrecer lectura de env protegido ni mocks como prueba final de navegador. T4 BLOCKED por este requisito humano; S1/S3 siguen parciales hasta recheck real, T1/T2/T3done intactos, T5pending por prerrequisitoT4. Sin handoff implemented, commit/push ni cierre de feature.

Punto de reanudación tras runtime disponible: preview propio4201 con envDir vacío → navegador dirigido SOLO F1/F2/F3 (incluido overflow móvil) → handoff/documentación/commit local del padre. Sin nuevas pruebas generales, sondas de motor ni revisión adicional. Esta actualización es únicamente documental y de memoria: no ejecuta verificaciones ni servicios.

### L12 — Runtime propio restaurado con los parámetros anteriores

Pedido original, literal: «Levantalos con los paramentros anteriores.»

Padre restauró la DB sintética propia existente55432, postgres17-alpine, conservando el mismo volumen anónimo. API8080 en parentjob2 desde JAR COPIADO con el mismo SHA256 `9dfaf3dbd4520e9c050b2d21119f134c94c52728c224ddff4cc7747908282084`; DEV4200job3 y preview productivo propio4201job4 con envDir VACÍO. Arranques correctos. GET públicos job5 de configuración y catálogo: HTTP200 en8080/4200/4201; configuración5contextos y byteidéntica a aceptación previa. Evidencia del padre: `.browser/normalization-live-preview/runtime-resume/health.json`.

Se recuperaron privadamente y solo en memoria los3parámetros POSTGRES del MISMO contenedor sintético creado por el agente, originalmente sin dotenv. La autorización humana explícita para reutilizar parámetros anteriores permite este alcance necesario; no es bypass de .env. La prohibición previa NoDockerEnv era una restricción del handoff del padre, revisada únicamente para este contenedor/estos parámetros. Sin acceso al entorno del host, salida/persistencia de valores secretos, .env real/.env.example, Compose, nuevaDB ni reset. No registrar valores de credenciales. Configuración efectiva ya guardada en mem168; no duplicarla aquí.

Incidentes: preflight de plantilla de childlaunch.py falló una vez ANTES de arrancar y fue corregido; el padre permitió readiness PostgreSQL con estados1/2 dentro de30s antes del arranque efectivo. Arranque final correcto; no confundir estos incidentes con defecto de producto ni navegador aprobado.

T4 vuelve a in_progress, sin bloqueo humano vigente; L11 conserva el bloqueo histórico verdadero. S1/S3 aún esperan SOLO recheck real F1/F2/F3 y overflow móvil, sin repetir positivos52filas/duplicados/exportaciones ni motor/suites/revisiones generales. T1/T2/T3done intactos y T5pending por T4. Sin nuevo PASS de navegador, aprobación nativa, handoffdone, commit/push ni cierre de feature. Esta entrada solo documenta lo observado por el padre; no ejecuta servicios ni comprobaciones nuevas.

### L13 — Recheck dirigido aceptado y cierre documental en curso

T4done: padre contrastó la evidencia y creó commit local `9d368fe`,6archivos/+83/-5 para F1/F2/F3. Focal57/57(34workbench,16layout,7evolution), suite completa203/15archivos, build/arquitectura/diffexit0 y3rdpartylicenses preservada; aviso649.22kB/500kB sin cambiar presupuesto. No sumar57/203/199 como un total nuevo. Motor/concurrencia/protocolo intactos: independientes previos siguen válidos, no repetidos.

QA `mvwxurvd`, continuación del rol `mvu4o1xq` tras restaurar runtime, rechecó SOLO los tres bloqueadores y móvil. F1: foco externo en Aplicar→hover fila2→Escape cierra sin reapertura inmediata, hover real TRUE y focoAplicar retenido; Escape interno y Cerrar restauran celda2:9. F2: media reduced-motion real,7pseudo-elementos con0s/none frente a7×.12s normal; checked/translate20 operable. F3: los8botones RENDERIZADOS (paginación, Cerrar original, Ver diagnóstico, Aplicar PrimeNG, Finalizar) miden44px en1920/390; sin overflow documental, footer envuelve y originalx14..376/y533.83..830. Botones de ventana de columnas NO renderizados con34columnas: no nueva geometríaPASS para ellos; selector cubierto por CSS scoped y regresión compilada. No recargó fixture500; su aceptación anterior permanece. Guarda Escape inactiva/otrosfooters no reproducidos en navegador: cubiertos por regresiones públicas57 y contraste de fuente.

HAR comenzó ANTES de navegar:17GET/0POSTPUT/sin cuerpos de solicitud; GET de metadatos catálogo/configuración200 antes/después y byteidénticos. Tres entradas workerstatus0 NO son éxito HTTP. Consola/errores0, sesión propia cerrada,4capturas nuevas abiertas por QA y2por padre. Padre leyó F1json, bboxesF3, HAR, bytesAPI y2imágenes; contraste durable `e2e/qa/recheck/parent-contrast.json`. Evidencia bajo `.browser/normalization-live-preview/{ui/t4-correction,seam-corrected,e2e/qa/recheck,runtime-resume}`.

Los positivos de L10 NO se repitieron:52filas/páginas10/25/50/100/última104; fixture500/ocultación/allhiddenconunafila; duplicados full[2,54] e ID[2,54]&[4,56];416celdas/52registros, modos explícitos/precisión;8warningsJSONCSV completos pese a filtro0 y retenciónSPA. Con ese baseline y recheck dirigido, los tres bloqueadores reportados S1/S3 están RESUELTOS, no siguen parcialmente pendientes por F1/F2/F3. No implica ISO exhaustiva, auditoría a11y/roving/matriz de opciones/original gigante. Glifos de espacios box-like siguen como observación previa, no corregida ni diagnóstico de fuente. Se preservan fallos/incidentes L6–L12. ASSESSmedium/nativeunassessable por untracked/candidate null, sin aprobación nativa; auditoría npm pendiente aceptada, no repetida.

Cinco cortes cohesivos ya observados: diseño `e3a80b89cf7e07c49c638c4435e270a4737d0532`, motor `3aaa6c709a4c858a40a51fbb11331bbfbb99a0a7` + `11746334f056aef240d3132cd9416db1f96b6bfb`, UI `7a2b2b6b82b6a585a1194f6d9cbc2e9762abba67`, corrección `9d368fe`. UI912adiciones+83correctivas como corte cohesivo histórico; no se comprimieron/borraron pruebas para400. Rama feature con base29eff98; aviso de18commits/11765líneas respecto a origin/main incluye features anteriores CERRADAS, no define el candidato actual de revisión. Sin PR/push/merge.

Padre ya marcó handoff `01-hoja-ancha` IMPLEMENTED con preview4200; esta tarea no toca handoffs/artboards/contrato. API8080job2+DB55432 y DEV4200job3 permanecen activos. Preview propio4201job4 aún activo: padre lo detendrá DESPUÉS de esta entrega, no consta parada todavía. T5in_progress: documentos/espejo preparados, faltan comprobación estructural documental, limpieza acotada y commit local documental observados por padre; feature no cerrada aún. Sin nuevas pruebas/build/browser/servicios en esta actualización pasiva ni RED conductual aplicable.

### L14 — Cierre T5 observado, desarrollo activo y preview propio detenido

T1–T5done; feature aceptada y cerrada con los límites documentados. Padre completó el corte documental de aceptación `4d0cfe1` (6archivos/+151/-13), posterior a corrección fuente `9d368fe`. Comprobación estructural documentalexit0: SOLO los2enlaces Markdown relativos añadidos válidos y handoffIMPLEMENTED; gitdiffcheckexit0. Evidencia `.browser/normalization-live-preview/runtime-resume/documentation-check.json`. No afirmar revisión de todos los enlaces/archivos del repositorio.

Salud final observada por padre: GETconfiguración/catálogoHTTP200 tanto API8080 como DEV4200; DB55432OPEN. Parentjobs2/3 siguen vivos. SOLO preview propiojob4/4201 detenido y puertoCLOSED; ningún otro recurso detenido. Evidencia `.browser/normalization-live-preview/runtime-resume/final-health.json`. Los estados in_progress/bloqueados y preview activo de L11–L13 son HISTÓRICOS, no el estado vigente.

Cortes de esta feature desde base `29eff9819830f4618592a53ed986f5008eb5ce40`: diseño e3a80b8, motor3aaa6c7/1174633, UI7a2b2b6, corrección9d368fe y aceptación documental4d0cfe1. No usar rango histórico contra origin/main como candidato de revisión actual; no se comprimieron ni eliminaron pruebas para400. Este último ajuste de seguimiento será commit separado del padre después de la entrega: sin SHA inventado, stage/commit/publicación por este worker. Sin push/PR/merge.

Suite vigente203/15archivos y buildPASS para fuente intacta;57focales e históricos no se agregan al total. Independientes motor/UI anteriores y recheck dirigido de3correcciones siguen siendo la evidencia, no nueva verificación del motor. Límites vigentes: aviso649.22kB/500kB sin cambiar presupuesto, auditoría npm pendiente aceptada, revisión nativa SIN aprobación, sin certificación exhaustiva ISO/accesibilidad/roving/matriz/originales gigantes y glifos box-like no corregidos. Intentos fallidos previos conservados. No se requieren ni ejecutan más comprobaciones funcionales en este cierre documental pasivo.
