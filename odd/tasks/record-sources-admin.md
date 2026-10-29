# Administrador de fuentes de registros biológicos
Mejorar la administración visual y alinear los módulos Angular/Java, sin alterar reglas ni contratos guardados.
Rama: `feat/normalization-data-treatment`. Entrega single-pr ya elegida para esta rama; sin push/PR/merge autorizados.

## Specs

- **S1**: «Mejora la visualizacion de la configuracion de validacion (Para todos estos cambios verifica UX-UI y Sistemas de diseño) Volvelo algo mas visual de un administrador. Cambiale el nombre a fuente de registros biologicos o un nombre mas acorde.»
- **S2**: Decisión humana: «Solo pantalla y menú (recomendado)», frente a «También reemplazar «Contexto» en el análisis».
- **S3**: «Pone tambien un mejor nombre en las carpetas del back algo mas acorte a lo del front. Aliena estos dos para que se entienda bajo el mismo contexto.»
- **S4**: «Un detalle, antes de que continues. Has que los campos dentro de el menu de fuente de registros, se pueda modificar entre si un campo puede ser obligatorio o opcional (Podrias agregar un boton al lado de el quitar por ejemplo que cambie entre estados)». Decisión: «Sí, conservarlos visibles y guardados (recomendado)».

## Tasks

- **T1 [S1,S2,S3]** — done — backend `40941aefd0c9da48022b2ef242cb876654a706f3` (96Java/16arquitectura/3codegen/packagePASS,89hashes+45preservados contrastados); diseño `6d115e6c272dfcbb60cd44be0f01dc73cdaea9a5` (49tokens/9alias,3artboards/estructuralPASS,01elegido). Trigger: backstop/unidadesdisjuntas. Risk:item3checker, aceptaciónindependienteenT3.
- **T2 [S1,S2,S3]** — done — frontend `0f4c1d365c129ed99044fd1b2b70ab310939a845`:01master-detail/record-sources/nombrepantalla-menú;136frontend/checker/buildfinalPASS ybrowserwriter+contrastepadrePASS. API/modelos/Contextointactos. Risk:item3checkercompartido; aceptaciónindependienteenT3.
- **T4 [S4]** — done — backend `13771c9525fe17fb87e50f1449c20a3296f2061a`:102Java/3codegen/16arquitectura/checker/packagePASS; padre90inputs+45protegidos/hashJARcontrastePASS. optionalFieldscompatible/mergeatómico. Risk:item1formato eitem4concurrencia, independienteenT3pendiente.
- **T5 [S4,S1,S2]** — in_progress — trasapagónhumanoautoriza«Volve a intentar, inicia otra vez los servicios.» RecuperarserviciospropiosyUNnuevoflujoacotado conbuildAngularE2EsinHMR.141tests previas/reportesno sonnuevaprueba;10→0→10/retención/descargas todavía pendientes. Capturaexternaeliminadaanteriormente, no nuevoacceso.
- **T3 [S1,S2,S3,S4]** — pending — aceptación final trasT4/T5; independienteprevioitem3PASS estructural/diferenciales, browserindependienteUNAVAILABLEChrome. No volverloPASSni reintentarencubierto. Nueva persistencia requiere pruebaindependienteacotada delcambiomaterial; UXreal/contrastepadre/runtime/docs/handoff/espejocierre pendientes.

## Log

### L1 — Pedido original

Mejora la visualizacion de la configuracion de validacion (Para todos estos cambios verifica UX-UI y Sistemas de diseño) Volvelo algo mas visual de un administrador. Cambiale el nombre a fuente de registros biologicos o un nombre mas acorde.

### L2 — Alcance confirmado

Respuesta a dónde usar «Fuentes de registros biológicos»: «Solo pantalla y menú (recomendado)».

Pedido añadido literal: «Pone tambien un mejor nombre en las carpetas del back algo mas acorte a lo del front. Aliena estos dos para que se entienda bajo el mismo contexto.»

Convención elegida: Angular `features/record-sources`, Java `co.edu.unicauca.backend.recordsources`. Nombre visible «Fuentes de registros biológicos». No cambiar el paso Contexto del análisis, identificadores/contextos, `/api/validation-configuration`, clave Query, tabla/columnas, migraciones V1–V4, revisión, reglas, exportaciones ni campos guardados. No inventar CRUD de fuentes, estados activa/inactiva, roles o estadísticas que el modelo no soporta. Conservar los cinco tipos y los valores libres/TDWG, guardas, control de concurrencia, invalidación y workbench montado. Solo presentación y organización de código.

### L3 — Exploración y ruta

HEAD de partida `657d41d`; cambios rastreados iniciales vacíos. Pantalla actual: selector nativo de contexto, lista de campos con Quitar, agregar mediante DwC, revisión/pendiente/guardar/actualizar. Menú en app.html. Sistema existente en frontend/DESIGN_SYSTEM.md y shared/design-system; no hay design/system.md ni artboards: sincronizar primero desde fuentes reales, sin inventar tokens. Diseños autónomos sin URLs externas. Padre opera gentle_design, porque el worker no declara esa herramienta.

Frontend134/backend96 y Chrome anteriores son baseline histórico, no pruebas nuevas de esta feature. Servicios de desarrollo existentes4200/8080/DB55432: no escribir metadatos vivos para probar; navegador puede editar borrador y descartarlo mediante lectura correcta, nunca Guardar contra esa base. Pruebas de persistencia únicamente con PostgreSQL desechable. No tocar dotenv ni .env.example, dependencias o servicios ajenos. Usar JAR separado y compilación aislada para evitar clases antiguas o sobreescribir artefactos en ejecución.

Unidades: diseño solo design/**; backend solo módulo movido/shared error-import/checkers/docsbackend; frontend solo módulo/consumidores/checkers/docsfrontend. Padre conserva README/AGENTS/VERIFICATION/este archivo/espejo, movimientos y commits. Workers sin commits ni borrados de archivos. No delegar exploración que el padre leerá para escribir. Pruebas conductuales UI con RED/GREEN; renombrado estructural con contraste de nombres antes/después y suites existentes, sin inventar RED de lógica de negocio.

Previsión: alrededor de1000–1600líneas authored incluyendo artboards y UI; movimientos puros no se comprimen ni se omiten pruebas para ajustarse a400. Mantener cortes coherentes por unidad y la entrega single-pr ya elegida en esta rama, sin autorizar publicación. API/caché/esquema permanecen idénticos para que backend y diseño sean independientes. Riesgo inicial del renombrado/presentación: sin item alto mientras no cambien esos contratos; reevaluar ante un cambio real de guardas/concurrencia/persistencia.

### L4 — Resultados backend y diseño

RED estructural padreexit1:carpetasrecordsources/record-sourcesausentes. Padre movió main/testbackend y arquitectura sin borrarcontenido. Dos lanzamientos rechazados antesdeiniciar porformato Allowed edit surfaces; corregido solo encabezadoposterior yreenviados íntegros. IDsreales todo19/20/21, no posiciones1/2/3.

Backendworker `mvt5mswe-1-10jq`: S3implementado, S2preservado; REDestructura16tests/15fallos, GREEN16/16; codegen3, arquitectura16/checker, Java96/0fallos/errores/omitidas ypackageofflinePASS. Padre contrastó89/89hashescheckout/copia y45/45recursosHEADintactos,5exit0 yXMLsummary96/0/0/0. Java24archivos+handler equivalentes normalizando solo namespace. Commit `40941aefd0c9da48022b2ef242cb876654a706f3`:309líneasdiff, módulo/checkers/docsbackend/AGENTSref. Risk:item3 porque checkercompartido ahora detecta namespace/directorio, requiere verificadorindependienteT3; ASSESSunassessableporuntracked conplanindependiente, sinreviewDue/continuación/aprobación. No API/esquema/seed/migración/catálogo cambiados.

Diseñoworker `mvt5mswk-2-2qum`: sincronizó `design/system.md`/system.html (49tokensmuseum+9alias;11primarios/4texto/7superficies/8nav/4error/1fuente/8espacios/5radios/1altura). Fuentesdocumentadas reales, sincolores/fonts inventados. Tresartboardsen `design/record-sources-admin/`:01-master-detail.html,02-source-deck.html,03-inline-register.html; HTML/JS/manifest/paleta/semillas estructuralPASS ycontrastecalculadomínimo5.44. No REDconductual parapropuestasestáticas; nobrowser aún. Canvas disponible127.0.0.1:46615, autoabrirventanafallóxdg-openausente(no productobug). Padre seleccionó01maestro-detalle mediantegentle_design implement; otros2sonalternativas. Handoff: implementarstackreal/componentes/token rules, nocopiarHTMLliteral, informarhandoffin_progress/implementedconpreviewURL. Diseño/cambiospropiossinpublicar, no editarContextodeanálisis.

### L5 — Corte de diseño y comienzo frontend

Diseño+spec commit `6d115e6c272dfcbb60cd44be0f01dc73cdaea9a5`,609adiciones: tresHTMLautónomos claramente distintos, lámina/sistema ymanifest/handoff, sin minificar ni omitir requisitos para400. Se conserva single-pr elegido, no publicación. T1done porpreparación/namespace/propiaspruebas; navegadorproductivo e independientechecker siguenenT3, no se consideranaprobadosporunboceto. T2in_progress; padre realizará movimiento frontend y estado handoff, writer debe conservarhelpersoriginales y observarREDconductualconcompilaciónválida antesdelrediseño.

### L6 — Frontend implementado y candidato contrastado

Padre movió solo la carpeta frontend y marcó handoffin_progress,preview4200. Worker `mvt6ap0u-3-sli9` implementóT2/S1–S3 conhelpersexistentes yderivadosvisualesenrecord-sources. REDDOM5fallos(compilaciónválida)→GREEN13/13; primera suite135/1porselectorCSSagrupado, separadoselectoressinretiraraserciones→136/136. BuildPASS(645.13kB/500aviso);últimorótuloHTML tuvo13focalizadasfinales. Padre ejecutójob5delcandidatofinal:checker+136/136+buildexit0. No reusar134históricas ni sumar ejecuciones.

Padre leyó editor/evidence y abrió3capturasdesktop/mobile/campolargo; contrastó7consumidores API/importer con SOLO importpaths ymodelosidénticos, GETconfig/catálogo before/after/actualbyteidénticos. Saveclona borradorcompleto,nofiltro. Browserwriter observó5fuentes/recuentos,búsquedamayúsculas/vacío/limpiar,pickerteclado/Escape/foco,borradoradd/remove/guardcancel/refreshGET200; documentos1440/390sin overflow, textolargoenvuelto. SinGuardar/PUT/POST/sincronización/biología; sesióncerrada. IncidentesacciónCLI/localizadorambiguo/clicfuera deviewport+espera25sagotada registrados, noreinterpretadoscomoéxito: recorridocorregidoconscroll/control exacto ycapturasfinales, sin aumentar límites. VERIFICATION recogeincidenteylímite; no navegadoractualdelpadre todavía.

README/AGENTS/currentfrontenddocs yfuentesendesign/system.mdalineados. T2todavíain_progresshastaelcommit; independienteitem3enT3pendiente para checkerscompartidos, sinaprobaciónnativa.

### L7 — Corte frontend y aceptación final

Frontend/rootdocs `0f4c1d365c129ed99044fd1b2b70ab310939a845`:368líneasdiff, UI+imports+pruebas+docs, sintocarAPI/caché/modelos/esquema ni Contextoanálisis. T2done porimplementación/propiaspruebas/capturascontrastadas. ASSESS delcorte(6d115e6completo→0f4c1d3)conitem3 requiereverificadorindependiente; nativeRiskunassessableporuntracked,sinreviewDue/continuación/aprobación. T3in_progressagrupa esapruebapendiente ycierrefinal, no se marcaaceptaciónhastaobservarla. Node/Javaanterioresno sesuman ylímitesbundle/npmaudit/nativecontinúan.

### L8 — Nuevo requisito de estados persistentes

Pedido literal: «Un detalle, antes de que continues. Has que los campos dentro de el menu de fuente de registros, se pueda modificar entre si un campo puede ser obligatorio o opcional (Podrias agregar un boton al lado de el quitar por ejemplo que cambie entre estados)».

Pregunta sobre conservar opcionales visibles yestado trasguardar/recargar; elección humana «Sí, conservarlos visibles y guardados (recomendado)». S4nuevo,T4in_progress/T5pending; T1/T2 permanecen cerrados paraS1–S3, no acreditanS4. T3vuelveapendingporprerrequisitointerno. Obligatorio/Opcional conservaelfieldenfuente, Quitarretiradeconfiguraciónadministrada. No es simplemente quitar requiredFields, ni mostrar todoTDWG. Entradaagregadanueva puede seguirdefaultobligatoria yalternarseantesdeguardar.

Extensión técnica aditiva `optionalFields` porcontexto; preservarruta/queryKey/contextkeys/tablas/migraciones/semillas/camposoriginales. Restricciónanterior L2sobreformaJSONseacota únicamente paraS4. GET/lecturalegada sinoptionalFields→vacío. PUTlegado que omitaoptionalFields DEBE conservar opcionalesguardados, no borrarlos silenciosamente; promoción explícita porrequiredFields no debecrear solapamiento. Valoresliteralessinrecorte, listasdisjuntas/sinduplicados,nulos/blancos/límitesigualdeestrictos; máximo500camposadministrados totales porfuente y200caracteres/campo. Todo ajuste bajo mismolock/revisión/save/flush, rechazo sin cambios/contador. Nada de V5 ni reescribirV1–V4 o actualizar configuraciones vivas durante pruebas. Testcontainersprueba roundtrip/opcional→obligatorio→opcional/quitar ylegacy/conflicto/rechazos; frontendprueba payloadcompleto/guardas/fila-foco/recarga/diagnóstico usa SOLOrequiredFields, basesfechas/coordenadasintactas. Los136/96previosno son prueba delnuevoestado.

### L9 — Resultado independiente anterior y límite de navegador

Verificador `mvt71u1e-4-tybl`: item3satisfecho,S2/S3PASS;16arquitectura+2regresiones/checkersPASS, diferencialCLIbase/candidato stdout/stderr/exitidénticos para consumidoresválidos, dependenciaSpringencatalogdomain rechazadaigual(exit1).61Java/25TSnormalizados y50protegidosiguales,89inputs/45preservadosconfirmados;96XMLobservadasnoejecutadasde nuevo. GETconfig/catálogobyteidénticos,sinPUT/POST. BrowserisolatedHOME:Chrome not found; no instalación/cacheglobal/reintento, sin capturas; no veredictoUXindependiente. Scratchpropiodelrole `/tmp/gpbY76WP/gatyiqS8/tmp.ACpiW6YVpj`, report/rawdiffs/testahí, no borrarni usarlocomopermisoparaotroscachés. Padresolo lo inspeccionará comoartefactopropiodelaherramienta; no exigeMavenextra ni repetirsuites. S4cambiacandidato, nuevaspruebasfuncionales legítimas no conviertenestaintento fallidoenPASS.

### L10 — Backend de opcionales comprobado

Worker `mvt7ph0a-5-iwkc` completóT4/S4:comandoapplicationConfigurationUpdate separapresenciaHTTP deldominio; parserJSONestricto ymergeopcionalbajolock/revisión. OmisiónPUTpreserva, promociónrequiredexactaretira solapamiento;[]explícitoelimina,null400sinmutación. LegacyreadsinoptionalFields→[], GETnose reescribe. Límites500combinados/200,disjuntos/textopreservado,5contextos,revision409/concurrencia. REDAssertJcompilenoesconductual; corregido,REDválido102/7fallos→GREEN102/0/0/0;3codegen/16arquitectura/checker/packagePASS. Padreleyóservice/codec/summary,contrastó90/90inputs y45/45protegidoscontra0f4c1d3,exits yJAR9dfaf3dbd4520e9c050b2d21119f134c94c52728c224ddff4cc7747908282084.

Commitbackend `13771c9525fe17fb87e50f1449c20a3296f2061a`307líneasdiff,tests/docsincluidos. ASSESSconitem1alto/noevaluableporuntracked exigeindependienteT3,sinreviewDue/continuación/aprobación. T4doneporimplementaciónypropiaspruebas, noaceptaciónindependiente. T5in_progress:preparandoDBE2Epropia55434/API8081/frontend4201 conimageIDlocal--pull=never yJARcopia, sinmetadatosvivos. BackenddesarrollodeberáusarcopiaverificadaantesdeactivarUIparanodejarclientenuevoanteAPIsinválida. NoV5/schema/seed/migraciones/catálogo/camposprevioscambiados.

### L11 — Runtime compatible y entrega frontend parcial

Job6exit0creóDBE2Epropia55434conimageIDlocalsinpull/JARcopiahashvalidado; APIjob7:8081/frontendjob8:4201. Solo backenddevjob3detenido yjob9iniciado conJARcopia13771c9;job10exit0confirmóHTTP200/5contextos/optionalFieldsen8080/8081/4200/4201, DEVrevision/requiredFields/catálogopreservados,sinPUTvivos. Mem153registraconfiguración; E2Eautorefreshdisabledsoloallí.

Writer `mvt8fsqe-6-y924` entregóPARTIALT5/S4: optionalFieldscompatible,estadosvisibles/fila-foco/conteos,payloadcompleto ybúsquedalosdosestados,removeambaslistas;soloartboard01actualizado. ReportaREDválido4fallos/60PASS→GREEN65/65, suite141/13archivos+checker/buildPASS645.32kB/500aviso;validadorproductivosinmodificación,engineunit10→0→10. ReportanavegadorE2E4PUT200depersistencia/recarga29required1optional,total30,volver30/0,quitar29/0/restaurarrev4; búsquedapayload5contexts/HARsolometadatos,campoenvuelto/44px/foco/390sin overflow. FuenteSCSSconservatokens;sourceactualbackendvivoaceptanuevoestado. PadreTODAVÍAno contrastóestosnuevoslogs/HAR/capturas.

Falta prueba REALde diagnóstico10→0→10/retenciónSPA/descargas: carga localarrojóerroresCLI/page_wedged, workerGETstatus0noHTTPsuccess. Noagregótimeoutslarger;guardóincidentedeoverlaycubrientoAgregar/esperaagotada,restauraciónconfirmada posteriormente. Sesióncerrada,serviciosE2Esiguen. Captura accidentalexterna `/home/dark/.agent-browser/tmp/screenshots/screenshot-1793259940647.png`, noabiertaniborrada; novale comoevidencia yningúnpermisoanteriorsobreotroscachéslaautoriza.

T5blocked a laesperadedecisiónhumana: autorizarundiagnósticoacotadodelnavegador/worker ypruebaposteriordelsistemacorregido, o dejarimplementaciónsinaceptar; disposiciónseparadadelarchivoexterno exacto. T3pending(dependenciaT5 ypruebaindependiente1/4deS4todavíaNOejecutada). Nodarporhecho, no reintentoverificadorChromeunavailableanterior, no ocultarlímites/nativa/audit/bundle.

### L12 — Decisiones humanas y diagnóstico acotado

Respuestas humanas: «Diagnosticar y comprobar el flujo afectado» y «Eliminar solo esa captura». Autorizaun únicodiagnósticoacotado ycomprobaciónposterior10→0→10/retenciónSPA/descargas, sin aumentartiempos ni tocarserviciosajenos; luego completarindependienteAPIpendiente. Noautorizaotroscachés ni reinstalarChrome ni repetirverificadorChromeanterior. Padre unlinkúnicamente `/home/dark/.agent-browser/tmp/screenshots/screenshot-1793259940647.png`, éxito, sinabrirarchivo/otrasrutas. Mem154guardaconcesión/disposición.

DoctorparentCLI0.40.0/Chrome156:9PASS,1warnffmpegopcional(noinstalar),0FAIL,launchaboutblank0.53s,Noactivedaemons. Recursosactuales4.2GBdisponible/ulimit31573,sinlímiteobvio; causapreviaEAGAIN/page_wedged NOdemostrada ni tratadacomosolucionadasolopordoctor. Ningúncambioderuntime/fuente/tiempos. T5in_progress, nuevaunidadacotadalectora/pruebaenE2E4201 preparada; si vuelvefallaraquí se reportaeseúnicointento, no másrondas.

### L13 — Intento autorizado agotado: prueba todavía no disponible

Continuación `mvtqb0kw-7-hhx1`PARTIAL: sesiónnueva record-sources-optional-authorized,E2E4201. openexit0sinHMRoverlay; uploadinputfiledevolvióDone. `wait --text 'Declare el contexto de los registros'`exit1,`Resource temporarily unavailable (os error 11)`. Se detuvo sinreintentos,nofixfuente/runtime/servicios ysin aumentartiempo. Consoleexit0soloVite/Angular/NG0751,noexcepciónproductivademostrada. HARstop/closeexit0,sesióncerrada. HARúnicamenteGETworkerstatus0,nopruebaHTTPsuccess,nocapturas/nodiagnósticos/descargas,0PUT/POST. Revisión4esúltimacomprobadaadministrativa, no nuevalecturadeesteintento.

Artefactos `.browser/record-sources-admin/e2e/optional-ui/authorized-recheck/{result.md,console.txt,trace.har}`. T5blocked pormissingproofagotada; no se marcanuevaverificación completa ni causa resuelta. T3pendingincluyeindependienteAPIS4item1/4todavíaNOrealizado ycontrastepadre141/HAR/capturas/trace/cierre. Needsyourdecision: prueba manual del flujo o pausa sinaceptación, sinotra investigación/reintentoautomático.

### L14 — Corte de energía y nueva autorización explícita

Usuario: «Se me fue la energia, vuelve a preguntar.» La pregunta anterior devolvióNoresult, no se infiereelecciónmanual/pausa. Respuesta humana nueva a la pregunta repetida: «Volve a intentar, inicia otra vez los servicios.» Autorizaahorarecuperaciónpropia yUNnuevoflujoacotadotrasreinicio, no borrar datosvivos ni cachés, no repetirsinfin. Runtimeinicialobservado: ningúnjob/HTTP4200/8080/4201/8081; DBdevExited255 yE2Eefímera--rm desaparecida. JAR9df/source/fixturespresentes; memcontext/search/obs150/file reconciliados, archivo más reciente queespejo.

Nuevohostjobs:1exit0DBdevexistente+E2Erecreada55434conimageIDlocal--pullnever,JARhashpreservado;2AngularDEV4200conNG_BUILD_MAX_WORKERS1/GOMAXPROCS2. Para separarpruebadeworker deHMR,se usaelbuildAngular ya existenteenE2E4201conVitepreview, sininstalarpaquetes. Previewinicial3detenido yreemplazado6confijaciónenvDirdepruebavacío: no dotenv. APIs4DEV8080/5E2E8081conmismoJARseparado;E2Ecatalogsyncdisabled. AntesdeAPI se confirmóconfiguración/Flywaydevexistentesyseguardóhash/contador tablaprevia;job7chequea4HTTP+hashespost(EN CURSO alregistrar). NingunapruebaUXaprobada todavía, causapreviaEAGAIN sigue sin demostrar. Delegarflujoacotadoporbackstopconsource-readonly/soloPUTmetadataE2E, luegoindependienteAPI1/4pendiente.

### L15 — Flujo real aprobado tras reinicio y contraste padre

Job7exit0:4HTTP200/5fuentes/optionalFields; TODOSloshashes/contadoresDBdev previos/postiguales. No nuevasmigraciones niPUTvivos; mem155guardarecuperación. Worker `mvtv1kqk-1-tiv0` COMPLETEDunflujoenbuildE2E:10→0→10/rev0→1→2,archivo12×30/collectionretenidos,mapeopredeterminado12controlesvisiblesiguales(no30/ni personalización),resultadosinvalidadosambosguardados. JSON/CSV10/0/10,subfamilyfilas2–11/col27/contextcollection/rev0y2,opcionalesvacíos. HAR2PUT200solometadatafull5fuentes y4GETAPI200;workerstatus0nosecuentaHTTPsuccess. Conjuntosrestaurados,subfamilyalfin/nobyte-order;consolasinerror/sesióncerrada.

Workercomparadoroffline fallóinicialmenteporrefsno normalizadostotalmente; se corrigiósolocomparador,sinrepetirbrowser. Padreleyóreport,abrió2capturasnuevas+2móvilesS4anteriores,contrastóJSON/CSV/HAR/GETactualrev2. Primerassertdelpadrefallóporque.exitteníatextoexit=0yno0; corregidoparseroffline,sinbrowser/PUTextra. Logs141/65/checker/buildexit0 confirmados, no nuevaejecucióndesuites141porpadre. parent-contrast.jsonrecogealcance. RuntimeDEVrealnoGuardado; TODOsT5aúnin_progresshastaelcommit, T3independienteAPI1/4sinrealizar aún. EléxitonodiagnosticacausadeEAGAINprevio; no ocultarfallos.
