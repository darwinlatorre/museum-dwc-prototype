# Administrador de fuentes de registros biológicos
Mejorar la administración visual y alinear los módulos Angular/Java, sin alterar reglas ni contratos guardados.
Rama: `feat/normalization-data-treatment`. Entrega single-pr ya elegida para esta rama; sin push/PR/merge autorizados.

## Specs

- **S1**: «Mejora la visualizacion de la configuracion de validacion (Para todos estos cambios verifica UX-UI y Sistemas de diseño) Volvelo algo mas visual de un administrador. Cambiale el nombre a fuente de registros biologicos o un nombre mas acorde.»
- **S2**: Decisión humana: «Solo pantalla y menú (recomendado)», frente a «También reemplazar «Contexto» en el análisis».
- **S3**: «Pone tambien un mejor nombre en las carpetas del back algo mas acorte a lo del front. Aliena estos dos para que se entienda bajo el mismo contexto.»

## Tasks

- **T1 [S1,S2,S3]** — done — backend `40941aefd0c9da48022b2ef242cb876654a706f3` (96Java/16arquitectura/3codegen/packagePASS,89hashes+45preservados contrastados); diseño `6d115e6c272dfcbb60cd44be0f01dc73cdaea9a5` (49tokens/9alias,3artboards/estructuralPASS,01elegido). Trigger: backstop/unidadesdisjuntas. Risk:item3checker, aceptaciónindependienteenT3.
- **T2 [S1,S2,S3]** — in_progress — worker frontend implementa01-master-detail en `record-sources`, actualiza consumidores/pruebas/docs y comprueba UI funcional. T1preparacióncompleta; 136frontend/checker/buildfinalPASS ybrowserwriter+contrastepadrePASS; corte de código listo, commit pendiente.
- **T3 [S1,S2,S3]** — pending — padre integra, contrasta evidencia UX/UI/sistema de diseño en escritorio/móvil y contratos preservados; actualiza documentación raíz, espejo y cierre. Commit pendiente.

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
