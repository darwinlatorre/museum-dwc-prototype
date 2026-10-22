# Museum Darwin Core MVP
Objective: browser-local biological record validation and versioned profile management. Branch: feature/museum-dwc.
Delivery: feature-branch-chain; local work-unit commits only, no publication. Forecast: 2000–3500 authored lines; cohesive slices may exceed 400 lines. Runners: Angular Vitest/build, Maven/JUnit/PostgreSQL, browser smoke.

## Specs
S1. «Utilizar [https://dwc.tdwg.org/](https://dwc.tdwg.org/) como fuente oficial.» «Incorporar un catálogo de los términos disponibles, incluyendo nombre, URI, definición, categoría y estado.» «No asumir que todos los términos Darwin Core son obligatorios.»
S2. «Crear perfiles independientes y versionados para SiB Colombia y el museo.» «Inicializar SiB Registros Biológicos 4.1 usando como referencia [https://biodiversidad.co/recursos/plantillas-dwc/](https://biodiversidad.co/recursos/plantillas-dwc/) y los siguientes campos candidatos: occurrenceID, basisOfRecord, institutionCode, collectionCode, type, catalogNumber, institutionID, collectionID, disposition, country, scientificName y taxonRank.» «Verificar su obligatoriedad real con la documentación SiB, incluyendo las reglas condicionales.»
S3. «Crear el perfil Museo 1.0 con los siguientes campos obligatorios: catalogNumber, recordedBy, eventDate, year, month, day, country, stateProvince, county, locality, minimumElevationInMeters, decimalLatitude, decimalLongitude, identifiedBy, scientificName, order, superfamily, family, subfamily, tribe, subtribe y genus.»
S4. «Permitir crear, editar borradores, duplicar y publicar nuevas versiones de perfiles desde la interfaz, sin modificar el código.» «Conservar las versiones publicadas sin modificaciones.»
S5. «Seleccionar archivo → Elegir perfiles → Identificar y mapear columnas → Normalizar valores de forma controlada → Validar → Mostrar diagnóstico.» «Usar Web Workers para el procesamiento. Separar el parser, normalizador y motor de validación en módulos independientes.» «sin subir el archivo al servidor durante el análisis.»
S6. «Presencia de columnas obligatorias según cada perfil.» «Campos obligatorios con valores vacíos.» «Reglas condicionales según el contexto indicado por el usuario.» «Validaciones básicas de fechas y coordenadas.» «Columnas desconocidas y posibles equivalencias Darwin Core.» «Cada incidencia debe indicar el campo, fila cuando corresponda, descripción, severidad y perfil que la originó. No modificar datos originales automáticamente.»
S7. «Diseñar una interfaz profesional con estructura y experiencia de usuario tipo **CRM o aplicación de gestión**, utilizando PrimeNG. Incluir navegación organizada, tablas, filtros, indicadores y un asistente para importar, validar y revisar los datos.»
S8. «Implementar en Spring Boot para administrar los perfiles y sus reglas, utilizando PostgreSQL y Flyway. La validación inicial será local en Angular, dejando preparada la importación segura y su posterior validación en el backend.» «Tecnologías recomendadas: Angular, PrimeNG, TanStack Query, Spring Boot, PostgreSQL y Flyway. Preparar la arquitectura para integrar Keycloak posteriormente.»
S9. «El MVP estará terminado cuando permita analizar un archivo localmente, detectar los campos faltantes para SiB 4.1 y Museo 1.0, mostrar los errores, descargar el diagnóstico y crear un nuevo perfil de validación sin cambios de código.» «Entregar código funcional, migraciones, pruebas y README con instrucciones de ejecución.»

## Tasks
T1 | S1-S3 | inline: source evidence, catalog and seed profiles | done | RED: missing seed files; GREEN: python3 scripts/test_seeds.py 3/3; commit 3422f39.
T2 | S4,S8,S9 | delegated backend: independent versioned profile management, migrations and API tests | done | Risk: item 1 (published data immutability), item 4 (concurrent publication); full suite20 PASS, independent recheck11 PASS; commit 8c76b3d.
T3 | S5-S7,S9 | delegated frontend: independent local file analysis and profile UI against fixed API contract | done | Risk: item 5 (XLSX parser dependency); parent full suite49 PASS/build PASS and independent49 PASS; commit e7e54ac. License/audit delivery decision remains T4.
T4 | S1-S9 | inline integration, README and functional verification; independent verifier for named risks | blocked | CSV/XLSX, downloads and GUI create/edit/duplicate/publish observed. Waiting for human: valid PrimeUI license path or compatible MIT migration; new audit authorization or explicit acceptance of unavailable audit proof. README/VERIFICATION.md prepared; feature not closed.

## Log
L1. Original request:
Desarrolla un primer módulo funcional para una aplicación web del Museo de Historia Natural de la Universidad del Cauca, orientada a gestionar registros biológicos basados en Darwin Core.
**Tecnologías recomendadas:** Angular, PrimeNG, TanStack Query, Spring Boot, PostgreSQL y Flyway. Preparar la arquitectura para integrar Keycloak posteriormente.
## Objetivo
Permitir seleccionar archivos Excel (.xlsx) o CSV, analizarlos localmente en el navegador y verificar sus columnas y datos mediante perfiles de validación configurables y versionados, sin subir el archivo al servidor durante el análisis.
## Qué requiero
**1. Catálogo Darwin Core**
- Utilizar [https://dwc.tdwg.org/](https://dwc.tdwg.org/) como fuente oficial.
- Incorporar un catálogo de los términos disponibles, incluyendo nombre, URI, definición, categoría y estado.
- No asumir que todos los términos Darwin Core son obligatorios.
**2. Perfiles de validación**
- Crear perfiles independientes y versionados para SiB Colombia y el museo.
- Inicializar SiB Registros Biológicos 4.1 usando como referencia [https://biodiversidad.co/recursos/plantillas-dwc/](https://biodiversidad.co/recursos/plantillas-dwc/) y los siguientes campos candidatos: occurrenceID, basisOfRecord, institutionCode, collectionCode, type, catalogNumber, institutionID, collectionID, disposition, country, scientificName y taxonRank.
- Verificar su obligatoriedad real con la documentación SiB, incluyendo las reglas condicionales.
- Crear el perfil Museo 1.0 con los siguientes campos obligatorios: catalogNumber, recordedBy, eventDate, year, month, day, country, stateProvince, county, locality, minimumElevationInMeters, decimalLatitude, decimalLongitude, identifiedBy, scientificName, order, superfamily, family, subfamily, tribe, subtribe y genus.
- Permitir crear, editar borradores, duplicar y publicar nuevas versiones de perfiles desde la interfaz, sin modificar el código.
- Conservar las versiones publicadas sin modificaciones.
**3. Procesamiento en navegador**
Implementar el siguiente flujo:
Seleccionar archivo → Elegir perfiles → Identificar y mapear columnas → Normalizar valores de forma controlada → Validar → Mostrar diagnóstico.
Usar Web Workers para el procesamiento. Separar el parser, normalizador y motor de validación en módulos independientes.
**4. Motor de validación**
En el MVP debe comprobar:
- Presencia de columnas obligatorias según cada perfil.
- Campos obligatorios con valores vacíos.
- Reglas condicionales según el contexto indicado por el usuario.
- Validaciones básicas de fechas y coordenadas.
- Columnas desconocidas y posibles equivalencias Darwin Core.
Cada incidencia debe indicar el campo, fila cuando corresponda, descripción, severidad y perfil que la originó. No modificar datos originales automáticamente.
**5. Interfaz de usuario**
Diseñar una interfaz profesional con estructura y experiencia de usuario tipo **CRM o aplicación de gestión**, utilizando PrimeNG. Incluir navegación organizada, tablas, filtros, indicadores y un asistente para importar, validar y revisar los datos.
**6. Backend**
Implementar en Spring Boot para administrar los perfiles y sus reglas, utilizando PostgreSQL y Flyway. La validación inicial será local en Angular, dejando preparada la importación segura y su posterior validación en el backend.

El MVP estará terminado cuando permita analizar un archivo localmente, detectar los campos faltantes para SiB 4.1 y Museo 1.0, mostrar los errores, descargar el diagnóstico y crear un nuevo perfil de validación sin cambios de código.
Entregar código funcional, migraciones, pruebas y README con instrucciones de ejecución.
L2. Human selected feature-branch-chain. No push/PR requested. Existing files are untracked starter code, no HEAD; .env must remain excluded. Existing Angular 22.2 / PrimeNG 22 / Query 5 / Spring Boot 4.1.1 / Java 21 retained.
L3. Fixed integration contract (implementation decision, not additional product scope): GET /api/catalog -> Term[] {name,uri,definition,category,status}; GET /api/profiles -> Profile[]; POST /api/profiles -> draft; PUT /api/profiles/{id} -> edit draft; POST /api/profiles/{id}/duplicate with {name,version} -> draft; POST /api/profiles/{id}/publish -> immutable published profile. Profile {id:string,name:string,version:string,status:'DRAFT'|'PUBLISHED',revision:number,description:string,rules:Rule[]}. Create request {name,version,description,rules}; update additionally {revision}. Rule {field:string,kind:'required'|'date'|'latitude'|'longitude',severity:'ERROR'|'WARNING',condition:'always'|'collection'|'permit'|'marine'|'permitAndCollection',message:string,source:string}. Conditions are explicit user context booleans collection/permit/marine; permitAndCollection = conjunction. No arbitrary script/eval rules. Diagnostics include profile name+version. Unknown columns are system warnings. Rule severities preserve documented ambiguity.
L4. Parent supplies backend/src/main/resources/data/catalog.json and profiles.json as immutable seed resources; workers must not edit these. Catalog derived from official TDWG CSV including Dublin Core imports and deprecated entries, with source snapshot metadata. Seeds SIB 4.1 and Museo 1.0 published. Backend reads both on initial migration/bootstrap idempotently. No file upload endpoint; development localhost only, future OIDC integration documented, no fake authentication.
L5. Official research: https://biodiversidad.co/elementos-darwin-core declares eight unconditional candidate fields; collectionCode,collectionID,catalogNumber depend on collection deposit; disposition metadata conflicts with empty-value instructions. Encode required disposition column under permit as WARNING with source text, nonempty required only permitAndCollection. Permit-dependent additional fields and marine occurrenceStatus/eventID included; GGBN extension outside core validator -> explicit advisory. SiB XLSX subsequently downloaded and its instructions read directly; see L6. Do not claim publication certification. TDWG sources https://raw.githubusercontent.com/tdwg/rs.tdwg.org/master/{terms/terms.csv,dc-for-dwc/dc-for-dwc.csv,dcterms-for-dwc/dcterms-for-dwc.csv}.

L6. Direct XLSX evidence: Instrucciones rows25–53 confirm eight unconditional fields, collection requirements, permit requirements, sampling eventID/eventDate and marine scientificNameID. Added sampling condition and requiredColumn rule kind; disposition column warning for permit/collection, nonempty for their intersection. individualCount matrix/history disagreement produces warning. Generated 414 terms; seed tests RED missing files then GREEN3/3.
L7. Runtime initially rejected writers; later measured context backstop admitted backend and frontend workers concurrently with disjoint surfaces. No manual runtime bypass. RDD assessment on initial untracked root was unassessable (explicit untracked scope needed), no reviewDue returned and no review started or approval claimed. Initial commit uses explicit agent identity el Gentleman <el-gentleman@localhost>, not a human identity. Browser capability probe failed: no Chrome installed; browser proof pending. Existing .env.example read was blocked; no alternate read attempted. Separate compose.mvp.yml ignores auto dotenv and uses isolated dev DB port55432; existing database untouched. npm audit found existing Vite development-server vulnerability; frontend worker tasked with a narrow compatible fix.

L8. Backend worker self-check and parent rerun: nine PostgreSQL integration tests PASS, executable package PASS, live API GET catalog414 and profiles2. Independent verifier found numeric enum coercion (0 accepted) and ignored nonempty publish request bodies. Single correction batch requested: strict enum strings and explicit rejection of publish content, unchanged profiles on400; no new publication revision contract. Human approved project-local Chromium installation; official Chrome for Testing156 installed under ignored .browser/ and named agent-browser session successfully launched.

L9. Backend correction evidence: focused RED11 failures (numeric enum3 + publish-body8), GREEN11/11; full suite20/20 and packagePASS. Independent verifier limited recheck running. Strict enum strings implemented per DTO; publish checks raw bytes before service, preserving empty-body200. Parent read both changes and restarted local API with corrected JAR. Source attribution corrected after official TDWG LICENSE verification: CC BY4.0, not CC0.

L10. Frontend partial delivery:48 pure testsPASS, deferred component testFAIL, buildPASS. Parent reproduced component RED then fixed only deterministic defer activation; full suite49PASS, independent verifier49PASS, final formatted-source suite49PASS/buildPASS. Initial bundle693.41kB produces unchanged500kB warning (below1MB failure threshold). Dependency lock coherence verified, but install/audit each timed out120s; no automatic retries.
L11. Real Chromium integration: CSV two profiles29ERROR+1WARNING; JSON/CSV downloads30 issues; HAR only2GET worker-bundle requests, no file upload. XLSX With errors and Complete sheets read; Complete zero issues after real keyboard selection. One30s expected-state wait failed because automation select changed DOM but not Angular model; diagnosed separately, no app workaround. Created/published Browser acceptance profile1.0 viaGUI, duplicated1.1 and edited draft; public API confirms independent versions/revisions/content. PrimeNG22 license notice visible; installed LICENSE requires valid key including community. No bypass. Release awaits human license choice and audit-proof decision. Details VERIFICATION.md.
