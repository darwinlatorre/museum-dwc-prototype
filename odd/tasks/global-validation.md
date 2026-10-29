# Validación global por contexto
Reemplazar perfiles por configuración global editable; rama `feat/normalization-data-treatment`.
Entrega `single-pr`, sin publicación autorizada; workers paralelos backend/frontend; pruebas seriales frontend y PostgreSQL desechable backend.

## Specs

- **S1**: «Elimina perfiles en el codigo de front y el back, no tiene sentido:».
- **S2**: «Has que en contexto, simplemente se escoja el contexto y la validacion sea una configuracion global configurable, para cada contexto en este caso para colecciones biologicas sea este.» Decisión: «Un único contexto (recomendado)».
- **S3**: «Campos minimos requeridos colecciones biologicas:
occurrenceID
basisOfRecord
institutionCode
collectionCode
type
catalogNumber
institutionID
collectionID
disposition (Este por ahora no lo coloques obligatorio)
country
scientificName
taxonRank
recordedBy
eventDate
year
month
day
stateProvince
county
locality
minimumElevationInMeters
decimalLatitude
decimalLongitude
identifiedBy
order
superfamily
family
subfamily
tribe
subtribe
genus».
- **S4**: «Para el resto sigue la obliegatoriedad que coloca el SIB

Elemento Darwin Core    Asociados a un permiso de recolección o acceso a recursos genéticos    Eventos de muestreo    Marinos    Otros*
occurrenceID    x    x    x    x
basisOfRecord    x    x    x    x
institutionCode    x    x    x    x
collectionCode
type    x    x    x    x
catalogNumber
institutionID    x    x    x    x
collectionID
individualCount**    x
organismQuantity**    x
organismQuantityType**    x
recordedBy    x
occurrenceStatus            x
preparations    x
disposition    x
eventID        x    x
eventDate    x    x    x
country    x    x    x    x
stateProvince    x
county    x
locality    x        x
minimumElevationInMeters    x
decimalLatitude    x        x
decimalLongitude    x        x
geodeticDatum    x
scientificNameID            x
scientificName    x    x    x    x
taxonRank    x    x    x    x».
- **S5**: Decisión sobre `disposition`: «Opcional solo en colecciones»; «En permisos será obligatorio, siguiendo la x de tu tabla.»
- **S6**: «Si puedes divide la tarea en algunos workers.» Entrega elegida: «Un solo PR (menos recomendado)».
- **S7**: «Retoma, vuelve a lanzar los dos workers y borra los datos historicos que mencionabas,»; alcance confirmado: «Eliminar mediante migración» — «Agregar una migración que elimine la tabla de perfiles y su trigger en cada base actualizada. Conservar catálogo, configuración nueva e historial de Flyway.»

## Tasks

- **T0 [S1,S6]** — done — inline: flujo anterior verificado conservado sin dotenv; commit `aa0306425d40fb64456ebb639e7e2468ed3db2df` (121 pruebas frontend/build/Chrome previos, diff --check PASS).
- **T1 [S1–S5,S7]** — done — frontend `65f4fa2d69b8b4430504249519f1ed2cb52f61f6` (padre133pruebas/build/checker/diffPASS); backend `84a49e8377f57bd6fa8e8f2fc6f8dc13de9bf43e` (writer96tests/paquete; padre75/75hashes, XML96sinfallos,3semillas/3codegen/12arquitectura/checker/diffPASS). Implementación cerrada, independiente19PASS; aceptación APIreal/Chrome completa y aplicación de migración en desarrollo pendientes en T3. Risk: item 1 (borrado irreversible autorizado), item 4 (revisión global concurrente).
- **T2 [S1–S5]** — dropped — seguimiento frontend separado fusionado en T1 para proyectar la ejecución paralela como una sola tarea activa; no se descarta su implementación ni sus specs.
- **T4 [S2,S7]** — done — inline: test bootstrap aislado de Tomcat JVM-global, Flyway/JPA/concurrencia reales y HTTP/reinicio aparte; job35focal2/2 y job36suite96/96sinfallos/errores/omitidas PASS; commit `3a7c682fc894fc1dae121056411762e5fc321ba1`. Producto sin cambios.
- **T5 [S2]** — done — inline: radio local18px/pine/foco; RED38, incidente matcher39, GREEN40(13/13), checker/suite134/build41PASS y Chrome42+tecladoPASS; commit `b599464953f4c07aef86fdb4e33fc79c58cf5ddf`. No modifica primitivas compartidas ni semántica nativa.
- **T3 [S1–S7]** — in_progress — inline + verificador independiente yaPASS + verificación Chrome delegada: completar APIreal/Chrome, actualización autorizada de desarrollo, documentación raíz y cierre; backend96PASS/frontend134+checker+buildPASS; commitfinal pendiente. Aceptación UI/API y retiro de3perfiles en DBdev acreditados; resta commit documental/cierre del registro. Sin aprobación nativa/publicación. Risk: item 1 (borrado acotado verificado), item 4 (concurrencia/revisión verificadas independientemente).

## Log

### L1 — Pedido original

Elimina perfiles en el codigo de front y el back, no tiene sentido:
Has que en contexto, simplemente se escoja el contexto y la validacion sea una configuracion global configurable, para cada contexto en este caso para colecciones biologicas sea este.

Campos minimos requeridos colecciones biologicas:
occurrenceID
basisOfRecord
institutionCode
collectionCode
type
catalogNumber
institutionID
collectionID
disposition (Este por ahora no lo coloques obligatorio)
country
scientificName
taxonRank
recordedBy
eventDate
year
month
day
stateProvince
county
locality
minimumElevationInMeters
decimalLatitude
decimalLongitude
identifiedBy
order
superfamily
family
subfamily
tribe
subtribe
genus

Para el resto sigue la obliegatoriedad que coloca el SIB

Elemento Darwin Core    Asociados a un permiso de recolección o acceso a recursos genéticos    Eventos de muestreo    Marinos    Otros*
occurrenceID    x    x    x    x
basisOfRecord    x    x    x    x
institutionCode    x    x    x    x
collectionCode
type    x    x    x    x
catalogNumber
institutionID    x    x    x    x
collectionID
individualCount**    x
organismQuantity**    x
organismQuantityType**    x
recordedBy    x
occurrenceStatus            x
preparations    x
disposition    x
eventID        x    x
eventDate    x    x    x
country    x    x    x    x
stateProvince    x
county    x
locality    x        x
minimumElevationInMeters    x
decimalLatitude    x        x
decimalLongitude    x        x
geodeticDatum    x
scientificNameID            x
scientificName    x    x    x    x
taxonRank    x    x    x    x

Si puedes divide la tarea en algunos workers.

### L2 — Decisiones humanas

- «Un único contexto (recomendado)».
- «Opcional solo en colecciones».
- «Un solo PR (menos recomendado)»; selección de forma, no permiso para publicar.

### L3 — Contrato técnico y límites

- Base previa: `17ce991dc8c57ca59a5c6a95ec74c6a539872c0e`; conservar primero el flujo compacto ya verificado (121 pruebas frontend, build y Chrome). No incorporar `.env.example` ni acceder a dotenv.
- Configuración global: `GET /api/validation-configuration` y `PUT /api/validation-configuration`, JSON `{revision: number, contexts: [{context: 'collection'|'permit'|'sampling'|'marine'|'other', requiredFields: string[]}]}`. Exactamente cinco contextos únicos; listas vacías permitidas como configuración explícita, campos no vacíos/duplicados rechazados, máximo 500 por contexto y 200 caracteres por campo. Texto de campos preservado, sin recorte implícito. PUT requiere revisión vigente; 409 si obsoleta y ningún cambio parcial. Solo metadatos, no datos biológicos.
- Semillas de contexto, en orden: colección 30 campos de S3 excluyendo `disposition`; base de los otros: occurrenceID, basisOfRecord, institutionCode, type, institutionID, country, scientificName, taxonRank. Permiso añade individualCount, organismQuantity, organismQuantityType, recordedBy, preparations, disposition, eventDate, stateProvince, county, locality, minimumElevationInMeters, decimalLatitude, decimalLongitude, geodeticDatum (22 total); muestreo añade eventID y eventDate (10); marino añade occurrenceStatus, eventID, eventDate, locality, decimalLatitude, decimalLongitude, scientificNameID (15); otros usa base (8). Las x se interpretan literalmente por este pedido, no se heredan advertencias de perfiles; no se inventa significado alternativo de **.
- Backend: nueva feature `validationconfiguration`, núcleo puro, puertos, JPA/MapStruct/Lombok y composición/decorador transaccional según proyecto. Migración V3 aditiva, fila global estable, lock→revisión→validación→save/flush atómico; bootstrap idempotente no sobrescribe configuración. V1/V2 y tablas/trigger históricos intactos. Retirar controladores/bootstrap/modelos/semilla activa de perfiles, no sus registros almacenados. No derivar defaults de un perfil histórico arbitrario. Catálogo sin dependencias productivas de configuración.
- Frontend: `features/validation-configuration` dueña de modelos/editor; Query raíz, AbortSignal e invalidación conservados. API nueva `validationConfiguration(signal?)`, `updateValidationConfiguration(body)`. Nada de perfiles, publicación, duplicación ni elección de perfiles en producto activo.
- Análisis: archivo→Contexto→mapeo→diagnóstico→normalizar→finalizar. Un radio obligatorio entre cinco contextos; al elegir no se bloquea el mapeo por encabezados faltantes: se diagnostican después para permitir equivalencias. Configuración requerida y errores reales visibles, sin defaults de éxito simulados. Workbench montado y motor en worker; reglas base de fechas/coordenadas conservadas. Snapshot usado incluye revisión; cambios globales invalidan resultado/generación. `WorkerRequest.validate` recibe `configuration`, `context`, `data`, `mapping`, `terms`, `options` (sin perfiles).
- Incidencia nueva: `{field,row,description,severity,context,configurationRevision}`, con context de los cinco o `system` para integridad base. Quitar `profile`/`version` del transporte worker/exportación; columnas/contexto/revisión reproducible, no ciclos de versiones. Mantener resumen compacto, filas y columnas originales, detalle único, foco, paso visible, descargas completas y originales intactos.
- Pantalla «Configuración de validación»: editar campos obligatorios por contexto mediante controles existentes/selector DwC; guardar globalmente con revisión. Valores TDWG e identificadores oficiales intactos. No imponer versiones/publicación nuevas ni agregar autenticación; permanece localhost.
- Workers paralelos con superficies separadas, cada uno incluye código/pruebas/docs. Backend dueño de backend y generación/semillas raíz; frontend dueño de frontend. Padre dueño de raíz README/AGENTS/VERIFICATION, este documento y espejo, integración y navegador. No arrancar/parar stack vivo; backend tests con PostgreSQL desechable; ejecución posterior en base de desarrollo aislada ya autorizada.
- Entrega single-pr. Previsión amplia: miles de líneas por retiro de módulos; commits por unidades coherentes, no eliminar pruebas de preservación ni comprimir código para ajustar 400 líneas. Sin push/PR/merge.
- RDD habilitado; ASSESS anterior no evaluable por archivos untracked sin continuación. No inventar revisión aprobada ni tocar `.env.example` para habilitarla. T1/T3 requieren verificador independiente por concurrencia (item 4), no por tamaño.

### L4 — Preparación y agrupación de ejecución

T0 cerrado en `aa0306425d40fb64456ebb639e7e2468ed3db2df`: 15 archivos, 1099 adiciones y 182 eliminaciones. Es el flujo anterior, no implementación de configuración global. Estrategia single-pr ya elegida; se acepta el corte coherente amplio sin comprimir ni retirar pruebas. Sin push ni PR. T1 agrupa seguimiento de los dos writers independientes; T2 se marca dropped solo por esa fusión de seguimiento. Contrato cerrado antes de ambos escritores; backend y frontend no comparten superficies de edición.

### L5 — Retiro de código y límite del rol writer

El writer backend inicial terminó interaction_required sin cambios ni pruebas: su rol no permite borrar archivos. El padre asumió el retiro autorizado, preservó 34 archivos de producción/semilla/pruebas de perfiles en `.browser/global-validation/profile-baseline/<ruta original>` y retiró sus copias activas; V1/V2, catálogo y datos PostgreSQL intactos. La cobertura aplicable de aquellas pruebas debe migrarse al módulo nuevo, no desaparecer. Se reanudó el writer backend como `mvrm4uad-8-zfbp` con la instrucción original completa; frontend `mvrm12ur-7-q85i` sigue independiente y coordinará cualquier retiro con el padre. No se interpreta una rotura temporal de compilación por quitar contratos antiguos como RED de comportamiento. README y AGENTS raíz actualizados por el padre; todavía no se verifican como producto nuevo.

### L6 — Retoma y cambio de alcance del historial

Pedido posterior, literal: «Retoma, vuelve a lanzar los dos workers y borra los datos historicos que mencionabas,».

Confirmación humana: «Eliminar mediante migración»; efecto mostrado: «Agregar una migración que elimine la tabla de perfiles y su trigger en cada base actualizada. Conservar catálogo, configuración nueva e historial de Flyway.» Este permiso sustituye la conservación de tablas/datos legados de L3/L5, no autoriza borrar otras tablas, volúmenes ni credenciales. V1/V2 ya aplicadas permanecen sin modificar; añadir V3 para configuración y V4 para retiro definitivo, sin CASCADE general. Probar la actualización desde V1/V2 con perfiles publicados en PostgreSQL desechable y demostrar que catálogo/configuración/Flyway sobreviven. No ejecutar borrado manual sobre bases existentes.

Ambos writers previos terminaron «assistant reported an error», sin resultados de pruebas verificables. Reconciliación: rama y HEAD siguen `feat/normalization-data-treatment`/`aa03064`; hay cambios frontend parciales, editor/modelos nuevos y una prueba backend nueva, pero aún no feature productiva backend ni migraciones nuevas. No deshacer parciales ni atribuirles los 121 tests anteriores. Padre conserva propiedad de borrar archivos fuente; el rol writer no lo permite. Workers nuevos deben completar/migrar cobertura desde los parciales y snapshots, no recomenzar a ciegas. Cobertura histórica cambia de preservación de perfiles a comprobar su retiro autorizado y la preservación de todo lo no afectado.

### L7 — Workers nuevos y documentación del borrado

Relanzados en paralelo `mvs9ashm-9-beon` (backend, incluido V3/V4 y pruebas de actualización) y `mvs9ashr-a-csjq` (frontend). El padre comprobó que los cinco archivos fuente legados frontend no tenían cambios propios, los preservó como referencia y retiró sus copias activas antes de relanzar; ninguna operación PostgreSQL. V1 confirma nombres exactos: tabla `profiles`, trigger `immutable_published_profile` y función `preserve_published_profile()`. El backend debe usar build aislado bajo `.browser/global-validation/backend-check/` para evitar clases compiladas antiguas y no limpiar el classpath del servidor de desarrollo existente. README/AGENTS/VERIFICATION raíz ya distinguen la migración irreversible autorizada de la conservación previa; diff --check de esos documentos PASS. Pruebas e implementación nuevas siguen pendientes; no confundir retiro fuente con borrado de datos aplicado.

### L8 — Frontend contrastado y corte local

Frontend `mvs9ashr-a-csjq` entregó partial: S2–S5 con 132 pruebas/build/checker aprobados reportados; S1 pendiente por dos textos de catálogo fuera de su superficie. Padre leyó editor/modelos/App/motor/helpers/exportación y corrigió esos textos con una regresión DOM pública: RED exit1 (1 fallida/4 aprobadas), GREEN exit0 (5/5). Luego suite propia completa 133/133 en13archivos y buildexit0; checker y difffrontendPASS. Aviso bundle642,77kB/500kB, sin cambiar presupuesto. Fallos de preparación/glob/fixtures delegados conservados en VERIFICATION.md, no se cuentan como RED conductual ni se esconden.

Corte frontend `aa03064..65f4fa2d69b8b4430504249519f1ed2cb52f61f6`: 43 archivos,1009adiciones/1590eliminaciones; single-pr ya elegido, no fragmentación artificial ni publicación. Solo superficies frontend incluidas, sin código backend ni dotenv. Backend informado del avance de HEAD y continúa independiente. ASSESS del corte no evaluable poruntracked; ASSESS global con escalación item1exige verificador independiente, que sigue pendiente para migración/concurrencia. API real, borrado aplicado, diferencial de catálogo y Chrome nuevo no verificados. T1 sigue in_progress porque falta backend; no extrapolar pruebas frontend a retiro de datos.

### L9 — Backend revisado y paso a aceptación integrada

Backend `mvs9ashm-9-beon` entregó completed para S1–S5/S7: configuración, revisión estricta, transacción/locks, bootstrap, V3/V4, pruebas y docs. Padre leyó EVIDENCE.md, V3/V4, servicio/decorador/store/repositorio y ConfigurationMigrationTests; contrastó 75/75 entradas SHA-256 en checkout/copia aislada, leyó XML de 96 pruebas sin fallos/errores/omitidas y ejecutó 3 pruebas semillas, 3 codegen, 12 arquitectura, checker y diff --check PASS. V1/V2, catálogo, procedencia y evidencia oficial SiB idénticos a aa03064. Writer reportó paquete aprobado y diferencial público catálogo14/14idéntico, todavía por contraste independiente.

Corte backend `65f4fa2..84a49e8377f57bd6fa8e8f2fc6f8dc13de9bf43e`: 71archivos,1404adiciones/3316eliminaciones, coherente con retiro de módulo completo bajo single-pr elegido. Sin rootdocs, dotenv ni publicación. T1done solo implementación comprobada por unidad; T3in_progress conserva prueba integrada, verificador y ejecución real. ASSESS de ese corte, escalado item1, requiere verificador independiente; nativeRiskunassessable poruntracked, sin reviewDue/continuación ni aprobación. Backend usó copiaaislada, no backend/target ni serviciosvivos. Se conservan límites: no RED individual para cada variante y algunos logs iniciales sobrescritos (EVIDENCE.md); no se inventa prueba faltante.

### L10 — Verificación independiente, autorización de caché e instancia real aislada

Verificador `mvsaa9u5-b-8pok`: sin defectos causales demostrados; S1/S3/S4/S5/S6 PASS estructural/documental, S2/S7 inicialmente UNAVAILABLE porque no ejecutó Maven (HOME/scratch del rol sin cachés ni red). Contrastó 75/75 fuentes,85/85baseline, conjuntos exactos30/22/10/15/8,3DROPacotados,V1/V2/recursos oficiales intactos y14/14observaciones públicas crudas del catálogo; codegen3/arquitectura12/checkerPASS. Scratch exigido por el rol: `/tmp/global-validation-independent-84a49e8.vAEzWV`, no una nueva base viva.

Se pidió y recibió permiso humano nuevo: «Autorizar copia de esos cachés», exclusivamente `/home/dark/.m2/repository` y `/home/dark/.m2/wrapper/dists` hacia ese scratch para prueba offline, sin settings.xml/credenciales ni modificar origen. Job27copió a `offline-home/.m2`, exit0, excluyendo configuración/dotenv/credenciales conocidas y comprobando enlaces fuera de alcance. Continuación del MISMO verificador `mvsqjc9g-c-5ih1`, no segunda revisión general: PRIMER Maven propio `bash ./mvnw -o -Dtest=ValidationConfigurationIntegrationTests,ConfigurationMigrationTests,ConfigurationUseCaseTests,ConfigurationMapperTests clean test`, exit0,19pruebas,0fallos/errores/omitidas,32.963s,stderr0bytes. S2/S7PASS, sin bloqueadores residuales en ese alcance; otros dictámenes mantienen evidencia anterior, no nuevas ejecuciones. Padre leyó exit/stdout/stderr y guardó memorias142/143. No atribuir aprobación de UI ni nativa a este resultado.

Aceptación real en curso: nuevo contenedor `universidad-global-validation-e2e-84a49e8-db` (localhost55433), API8081/job29, frontend4201/job30 con proxy propio, sin parar servicios existentes. JARcopia `e2e/backend-84a49e8.jar` SHA256 `fc7020a4ee61565cdf5e5c4bff060ba9158954afc0e793f818af2bdf6b6e2369`, idéntico al paquete aislado para no sobrescribir un JAR en uso. Padre comprobó overridesDBheredados ausentes,10sesionesAPI en ESA base yFlyway1–4/perfilesausentes; HTTP200 API/proxy. GET real coincide con semilla rev0 yfieldsetscorrectos; `/api/profiles` y `/api/upload`404. Eso prueba instalación nueva aislada, NO borrado de registros en DBdevexistente. Fixture sintético12×30 creado sin disposition obligatorio en colección.

Chrome propio `global-validation-e2e-01a18024` abierto en1440×1000; navegación6pasos sin perfiles observada, lecturaCSVlocal en curso. Seamcheck completo propio job33 lanzado (frontend+backendofflinecon cachéCOPIA; no original), resultado aún pendiente al registrar. API/Chrome completo, aplicación porFlyway a DBdevautorizada, documentación/commitfinal y cierre de recursos siguen pendientes.

### L11 — Seamcheck fallido, corrección acotada de prueba y captura pendiente

Job33 terminó exit1: frontend133pruebas/buildPASS, backend96pruebas/0fallos/1error. Error en `ConfigurationMigrationTests.simultaneousFreshInstallRunsFourMigrationsAndBootstrapsExactlyOneConfiguration`: `Unable to create the directory [/tmp/tomcat.0.6165251174073386662] to use as the home directory`, al iniciar dos servidores web en una JVM. No fue timeout ni fallo de aserción SQL. Rawlog y XML conservados en `parent-seam-failed.log`/`parent-seam-failed-migration.xml`; el filesystem del proyecto tenía946GBlibres.

Padre corrigió solo ese caso: dos contextos Spring `WebApplicationType.NONE`, comprobaciones por puerto público de aplicación y JPA, manteniendo Flyway/bootstrap reales simultáneos; HTTP/reinicio permanecen en pruebas separadas. Código productivo no cambió. Nueva copia y `parent-seam-input-manifest.json`75/75; Maven usa `java.io.tmpdir` explícito dentro del scratch autorizado. Focalizado job35exit0,2pruebas/0fallos/errores/omitidas (19.836s), memoria144actualizada. Suite backend completa corregida job36 en curso al registrar; no afirmar aceptación final ni ocultar job33fallido.

Incidente separado de automatización: se observaron5radios y una selección collection tras alternar marine→collection; screenshot falló por carpeta `screenshots` inexistente, por lo que los clics siguientes de la cadena no ocurrieron. Padre creó la carpeta; aún no hay captura válida del flujo global. T4 es prerequisito interno, T3 queda pending. APIE2E nueva sigue abierta; DBdevexistente todavía no migrada.

### L12 — Corrección de prueba comprobada

Job36 offline completo terminó exit0:96pruebas/0fallos/errores/omitidas,39.167s. Cierra el componente backend del seamcheck; frontend133/build ya había aprobado en job33 y no cambió desde entonces. No sumar ejecuciones repetidas ni borrar el fallo previo. Commit `3a7c682fc894fc1dae121056411762e5fc321ba1` contiene solo la corrección de test (8adiciones/4eliminaciones), sin alterar SQL/código productivo ni JAR E2E. Memoria144actualizada. ASSESS del corte test sigue no evaluable poruntracked, sin continuación/aprobación; no invalida el PASS independiente previo del producto sin cambios. T4done/T3in_progress. Carpeta de capturas ya preparada; job37 reanuda recorrido público contexto→mapeo→diagnóstico, resultado pendiente al registrar.

### L13 — Defecto visual descubierto en captura real

Job37exit0 y dos capturas generadas y abiertas: contexto único correcto y diagnóstico `subfamily`10de12, seis pasos sin perfiles. Captura de contexto demuestra radios nativos azules/sobredimensionados: selector de entradas de texto en `_forms.scss` también incluye `type=radio`, heredando ancho100%,padding y mínimo39px. Corrección SOLOlocal en `importer.scss`, sin cambiar primitivas compartidas:18px/flexfijo,pine,foco visible. REDjob38exit1(1fallida/12PASS). Primer intentoGREENjob39falló por matcher de CSS que ignoraba atributos de encapsulación Angular; matcher corregido manteniendo todas las aserciones, job40pendiente. Sin nueva suite/build/captura corregida aún. T5in_progress/T3pending; memoria145descubrimiento. No interpretar dos capturas como aceptación completa ni aplicar borrado en DBdevtodavía.

Cortes de entrega locales: `aa03064` UXprevia, `65f4fa2` frontend, `84a49e8` backend con retiro irreversible autorizado y verificación independiente, `3a7c682` solo infraestructura de prueba (12líneasdiff). Próximo corte T5 es solo CSSlocal+regresión. La rama acumulada supera400líneas; se conserva la decisión humana S6 de un únicoPR, sin publicar ni crearPR aquí. No agrupar nuevos cambios ajenos para ocultar ese tamaño.

### L14 — Radios verificados y nuevo corte local

GREENjob40exit0,13/13focalizadas. Job41exit0: checker,134pruebas/13archivos ybuildPASS, bundle642.98kB/500kBsin cambiar presupuesto. Job42 y capturas desktop/mobile corregidas abiertas: cinco radios18×18px, pineRGB(25,76,58), solo collection marcado; móvil390px/documento390px. Prueba pública de foco+ArrowRight seleccionó solo permit, ArrowLeft restauró solo collection; ambos foco-visible/outlineverde2px. Al cambiarcontexto se invalida diagnóstico como corresponde, archivo continúa montado. Commit `b599464953f4c07aef86fdb4e33fc79c58cf5ddf`:2archivos/26adiciones, selector local+regresión, sin primitivas compartidas ni contrato/motor/API modificados. T5done/T3in_progress. Cuatro capturas nuevas válidas abiertas (contextooriginal, diagnóstico, contexto desktop/mobile corregido); falta el resto de aceptación global. Memoria145seactualiza con estos resultados. No migración de DBdevexistente todavía.

### L15 — Handoff de aceptación restante

Por backstop de contexto, verificador `mvsrmxax-d-kpme` recibe T3/UI con control exclusivo de sesión Chrome existente y permiso solo para editar/restaurar metadatos de configuración en DBE2Eaislada mediante controles públicos. Sin cambios fuente/suites/deploy/servicios/dotenv. Debe comprobar detalle/export/settings/guardas/invalidación/normalización/Finalizar/HAR y devolver artefactos+dictamen porSpec; todavía en curso. Padre actualizó VERIFICATION con backend/independiente/fallos33y39/GREEN36y41 y límites, sin declarar aceptación completa ni borrado en desarrollo. Padre contrastará artefactos antes de actualizar únicamente su backenddev mediante Flyway autorizado y cerrar T3.

### L16 — Aceptación UI/API y contraste propio aprobados

Verificador `mvsrmxax-d-kpme` PASS en UI/API S1–S5, S6/S7fuera de ese corte; navegador cerrado, sin cambios fuente. Padre abrió las3capturasacceptance, analizóreport/HAR/JSON/CSV/snapshots y GETreal:10incidencias completas con filtro0, filas2–11/contextocollection/rev0o2segúnexport; dosPUT200solo{revision,contexts},sin nombres/filas/celdas. Guardacanceladaconserva29campos,save0→1invalida resultadosreteniendo archivo/contexto/mapeo,0errores; restore1→2restituye10errores yconjuntossemilla. Catálogo/status byteidénticos. Consentimientonormalización0cambios/Finalizarvacío/pasoactivomóvil/foco/cierreEnter/pickerEscapePASS. Otros4contextos solo metadatos, sin repetir409ni auditoríaexhaustiva; Escape no cierra detalleinline preexistente, cierreexplícito sí. Incidentes de refs/animación/confirm/textoassert se registran en VERIFICATION, no se ocultan ni se atribuyen al producto. Artefactos `acceptance-report.json`, `parent-acceptance-contrast.json`, HAR/downloads/screenshots bajo E2E.

### L17 — Flyway aplicado a desarrollo propio y recursos E2E cerrados

Tras aceptación, identidad de `universidad-normalization-dev-db`/127.0.0.1:55432/normalization_dev confirmada, baseline3perfiles/1catalog_snapshot/Flyway1–2+hashes/GET200capturado. JARfc7020a4... separado y fuentesproductivas iguales al verificado. Solojob3(backendpropio8080)detenido, nuevojob43conCLIURLDB/usuario/localhost8080 explícitos. Job44exit0 acreditó Flyway1–4success, ausencia de tabla/trigger/función legados y retiro de los3registros; hash/contadorcatalog_snapshot yFlyway1–2iguales, catálogo/statusHTTPbyteidénticos en contrasteinmediato,configrev0/campos30,22,10,15,8,backend8080+proxy4200HTTP200,profiles/upload404. NoSQLmanual ni dotenv niMVPajeno; programacióncatálogohabitual intacta. Mem146guardadainmediatamente. Pruebas/archivos en `development-update/migration-report.json` ybefore/after bajo `.browser/global-validation/`.

E2Ejobs29/30detenidos; DBpropia55433cerradajob45exit0trasconfirmaridentidad. Chrome cerrado. Desarrollojob2/4200,job43/8080,DB55432 permanece activo. VERIFICATIONactualizado;20referenciaslocalesactuales válidas ydiff --checkPASS,excluyendo dotenv sinacceder. Resta commit documental y registrar su identidad antes de T3done; sinpush/PR/aprobaciónnativa. Advertenciabundle642.98kB/500, auditoríanpmaceptadapendiente, REDindividual noacreditadoparatodavariante ylogs inicialessobrescritos se mantienen como límites, no pruebas inventadas.
