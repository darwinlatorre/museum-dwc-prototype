# Evidencia de verificación del MVP

## Estado actual: Lombok, MapStruct y auditoría de los workers

Cortes locales de código: `d53a1e1` (generación), `8f7b381` (perfil) y `75395bb` (catálogo), sobre `8dab659`. No se publicó la rama.

**Comprobado por el padre sobre fuentes aisladas:** Lombok genera builders, constructores y accesores apropiados; cinco interfaces MapStruct generan conversiones HTTP, JSON y persistencia con `unmappedTargetPolicy=ERROR`. Los codecs Jackson usan `@Context`; las actualizaciones `@MappingTarget` no reemplazan la identidad administrada. El adaptador se llama `JpaCatalogStore`, los cuerpos Java usan imports/nombres cortos y se retiraron las tres carpetas vacías de fuentes/recursos. Sin cambios de contrato, esquema o datos vivos.

| Comprobación nueva de este pedido | Resultado observado |
|---|---|
| Configuración de generación | RED 3→GREEN 3; regresión de arquitectura RED 1/12→GREEN 12/12; checker real PASS |
| Corrección de builder | Compilación RED por sombreado de `Profile.Builder` sobre `@Builder`; nombre estándar `ProfileBuilder`, luego 20 focalizadas PASS |
| Builder de `Term` | RED por `builder()` ausente; prueba incorporada y GREEN dentro de la suite final |
| Suite final aislada | **185 pruebas en 15 clases, cero fallos, errores u omisiones**, Maven exit 0; las focalizadas son subconjunto y no se suman |
| Paquete aislado | `package -DskipTests` exit 0 después de la suite; JAR con API MapStruct 1.6.3 y sin Lombok, binding ni procesadores |
| Trazabilidad de fuentes | 82 SHA-256 del snapshot coinciden con fuentes/configuración/scripts del checkout actual; cinco `MapperImpl` generados y compilados |
| Contrato HTTP | **50/50 observaciones idénticas** frente al baseline nuevo de `8dab659`, incluidos estado, cuerpo exacto y headers; ambos runners exit 0 |
| Revisión independiente | **Perfil completo; catálogo completo; S1–S5 cumplidos, sin bloqueadores.** Contrastó 82/82 hashes, 50/50 respuestas, 185 tests/15 reportes, JAR, generados, API JPA mediante javap y scripts Python; no repitió Maven ni usó target compartido |

### Incidentes, alcance y límites

Los dos writers de perfil/catálogo terminaron con «assistant reported an error» y dejaron cambios parciales. El padre no los relanzó a ciegas: reprodujo los errores y reabrió la aceptación ante el pedido humano de comprobar todo el trabajo. Además del sombreado de `Builder`, corrigió tres imports de constantes que requerían `import static` y un consumidor de prueba del helper de estado convertido a MapStruct. Los primeros checks fallidos están conservados, no se presentan como GREEN.

`backend/target` contenía una implementación MapStruct anterior a su interfaz y un `.class` con stub `Unresolved compilation problem`; no se determinó qué proceso lo reescribió. La aceptación no usa esos artefactos: se copiaron solo `pom.xml`, `mvnw`, `.mvn`, `src` y `scripts` a `.browser/backend-lombok-mapstruct/candidate-audit`. El primer build limpio ejecutó 185 pruebas, con cero fallos y un error porque la copia omitía los fixtures `sources/tdwg`. Tras copiar exactamente los tres CSV oficiales, la suite completa y el paquete aprobaron. No fue un fallo del producto ni se omitió la prueba para pasar.

Evidencia durable ignorada en `.browser/backend-lombok-mapstruct/`: `baseline.{stdout,stderr,exit}`, `{resume-focused,corrected-focused,cleanup-green,cleanup-corrected,cleanup-final,isolated,isolated-corrected}.{stdout,stderr,exit}`, `audit-summary.json` y `candidate-audit/source-manifest.json`. No se usaron dotenv, datos vivos, servicios existentes ni pruebas de navegador nuevas. El verificador confirmó que `ProfileEntity.replace` sigue vivo por su constructor, por lo que no se borró por apariencia. Su primera lectura auxiliar buscó el manifiesto un nivel incorrecto (exit 1); corregida la ruta, los probes de aceptación dieron exit 0. Su scratch externo queda conservado: no se limpió sin autorización. No hace falta relanzar writers ni agregar el probe durable opcional como una nueva condición. No hay push ni PR autorizados. ASSESS sigue no evaluable por archivos untracked, sin `reviewDue` ni continuación: no se inventa START ni aprobación nativa ni se cambia RDD. Auditoría npm y demás límites históricos siguen sin resolverse.

Ver [especificación y pedido humano](odd/tasks/backend-lombok-mapstruct.md), [perfiles](backend/PROFILE_ARCHITECTURE.md), [catálogo](backend/CATALOG_ARCHITECTURE.md) y [configuración](backend/README.md).

## Historial: responsabilidades y empaquetado del backend

**Resultado comprobado:** perfiles y catálogo conservan núcleos Java puros y paquetes explícitos `domain`, `application` e `infrastructure`. Los mappers HTTP y de persistencia pertenecen a infraestructura; las fachadas web coordinan conversiones sin introducir DTO HTTP en aplicación. `Profile.builder()` construye por campos nombrados, sin sustituir validación ni reglas de negocio. `ProfileBeanConfig` y `CatalogBeanConfig` componen los adaptadores. Se mantienen bloqueos, transacciones completas y actualización de entidades administradas, sin cambios de contratos HTTP, esquema ni dependencias. Alcance: [T2, S2/S3/S5/S6/S7](odd/tasks/backend-layer-responsibilities.md).

**Diferencial aprobado:** 50/50 observaciones HTTP idénticas contra `af5edab`. Cortes locales de código: perfiles `a6bd16e`, catálogo `3b99fb1`; referencias `refactor/backend-profile-layers` y `refactor/backend-catalog-layers`. Sin push ni PR. La verificación independiente no encontró bloqueadores.

**Revisión nativa no disponible:** ASSESS, incluso con rangos `committedOnly`, rechazó la evaluación por archivos untracked sin declaración explícita. No devolvió `reviewDue` ni continuación; no se inventó START ni aprobación, ni se cambió el switch. El riesgo item 4 (concurrencia por reubicación transaccional/JPA) se cubrió con autoverificación y verificador independiente. La evaluación nativa fallida no se presenta como prueba aprobada.

| Comprobación de esta refactorización | Resultado observado por el padre o verificador |
|---|---|
| Focalizadas Maven | 8 pruebas de builder, mappers HTTP/persistencia de perfiles y mapper HTTP del catálogo; cero fallos, errores u omisiones |
| Suite Maven del padre | **171 pruebas en 13 clases de pruebas actuales**, cero fallos, errores u omisiones; las ocho focalizadas están incluidas, no se suman |
| Paquete | `bash ./mvnw package -DskipTests`: exit 0, después de la suite; no sustituye la ejecución de pruebas |
| Arquitectura | `python3 -B backend/scripts/test_architecture.py`: 10/10; `python3 backend/scripts/check_architecture.py` y `git diff --check`: exit 0 |
| Verificador independiente | Sin bloqueadores; compilación pura `javac`, 65 casos de núcleo y comprobaciones Python aprobados, sin repetir Maven compartido |
| Diferencial público | Baseline aislado `af5edab`, `ProfileContractTests`: exit 0 en 22 s; **50/50 diccionarios idénticos**, incluidos cuerpo exacto, estado y encabezados |

Desde `backend/`, el padre ejecutó `bash ./mvnw test` y `bash ./mvnw package -DskipTests`. Los conteos se contrastaron con las 13 clases de fuentes actuales, sin sumar XML obsoletos, ejecuciones focalizadas ni pruebas independientes. Los contratos req/res se aplican a cuerpos de negocio: se preservan JSON publicado del catálogo sin envoltorio, parámetros de ruta, `ProblemDetail` y operaciones sin cuerpo.

### Recuperación de evidencia y límites

El log temporal original del baseline se perdió al reanudar. El padre regeneró **solo el baseline** en `.browser/backend-layers/baseline-af5edab`, con PostgreSQL desechable; recuperó las 50 observaciones actuales desde los XML Surefire existentes, **sin repetir la suite actual**. La comparación de diccionarios incluyó cuerpo como cadena exacta, estado y encabezados. Artefactos ignorados bajo `.browser/backend-layers/`: `baseline-contract.stdout`, `baseline-contract.stderr`, `baseline-contract.exit`, `current-contract.json`, `http-contract-comparison.json` y `suite-summary.json`. El incidente no se presenta como una ejecución perdida aprobada sin respaldo.

El cierre documental es pasivo: lectura de documentos, contraste de ubicaciones Java y `git diff --check` acotado, sin RED significativo ni Maven nuevo. No agrega navegador, auditoría de seguridad, acceso a dotenv ni datos vivos. La auditoría npm pendiente aceptada y demás límites históricos permanecen. El padre conserva el registro de tareas y la decisión de commits/revisión/entrega.

Ver [backend/README.md](backend/README.md), [arquitectura de perfiles](backend/PROFILE_ARCHITECTURE.md) y [arquitectura del catálogo](backend/CATALOG_ARCHITECTURE.md).

## Historial: entorno raíz y arranque completo con Compose

**Implementado y probado:** `start.sh` valida el entorno raíz con Compose, compila Angular y el JAR y ejecuta `up --build -d --wait --wait-timeout 180`. `docker-compose.yml` es el único manifiesto principal; sirve frontend nginx, backend Java21 no root y PostgreSQL17. El datasource usa5432 por defecto, con override `DB_PORT`; todos los puertos publicados son loopback. Se conserva `universidad_museum_mvp_data`, nunca el volumen original `universidad_postgres_data`.

La plantilla `.env.example` fue asumida manualmente por el humano tras el bloqueo del harness. No se leyó, modificó ni stageó; la excepción de `.gitignore` permite versionarla manualmente, **no demuestra su publicación**. Tampoco se accedió a los `.env` reales. El antiguo `backend/.env` deja de consumirse, sin borrarlo; Compose utiliza únicamente el entorno raíz. Sin cambios de dependencias, contratos de API, migraciones ni registros biológicos.

| Comprobación | Evidencia observada |
|---|---|
| Test-first del arranque | Writer:15fallos iniciales→8pruebas Python PASS; casos de ayuda/argumentos, orden, rutas con espacios, fallo por etapa, datos intactos, entorno literal y modelo Compose con credenciales/puertos |
| Backend |163/163tests,0fallos/errores/omisiones ypackagePASS; incluye3EnvironmentDefaultsTests nuevos. Padre contrastó nueve XML correspondientes a fuentes actuales, sin sumar informes obsoletos |
| Contraste del padre |8PythonPASS4s,`bash -n start.sh backend/docker-healthcheck.sh` ydiffcheckPASS |
| Independiente previo |8Python+3SpringDefaults+modelo aisladoPASS, sin repetirlos en la continuación de runtime |
| Arranque real aislado |`start.sh` copiado sin modificar, ejecutado desde otrocwd:exit0,514paquetes instalados,Angular/Maven/Dockerbuild/upPASS;3/3healthy,backendUID999 |
| Proxy y recursos |Pornginx127.0.0.1:44622:HTML/SPA/JavaScript y`/api/catalog/status`/`/api/catalog`HTTP200;414términos,bundled,attempts0 |
| Datos y teardown |Modelo con proyecto/volumen/red propios, puertos efímeros loopback,ningúnvolumenoriginal;JARsin dotenv/passwordficticia;teardownowncontainers/networkexit0sin-v,volumenfixtureconservado |
| Licencias |Regresión estructural nuevaRED1→GREEN1; corrección deCOPY+allowlist. Build focalizadofrontend ylectura deimagenexit0:licencias39053bytes,SHA-256`ad9605479aca6631f34dc41e2c197174dde8945e82225c1e160d88efd5bafc29`;index2806bytes intacto |

La prueba real usó el directorio **expresamente autorizado** `/home/dark/projects/museum-compose-proof`. Un shim Docker exclusivo de la prueba sustituyó el proyecto fijo y agregó un overlay de aislamiento: solo proyecto, nombre de volumen, puertos efímeros y scheduler deshabilitado para no consultar TDWG durante la sonda. El modelo resuelto se validó **antes** del arranque. No se ejecutó el script sobre el checkout ni sobre el entorno real del usuario. El padre leyó `logs/result.json`: todos los comandos exit0 y salud/HTTP/resultados anteriores confirmados.

Comandos del producto: `./start.sh`, `./start.sh --help`. Pruebas: `python3 -B scripts/test_start.py` (o `PackagingTests` para la regresión focalizada),`bash -n start.sh backend/docker-healthcheck.sh`, Maven `test` seguido de `package -DskipTests`. La omisión de tests del segundo comando no sustituye los163ejecutados. No hubo RED Spring separado: el contrato de la unidad autorizó una ejecución integral Maven después de GREEN Python. La corrección de licencias solo reconstruyó la imagen frontend y extrajo el archivo mediante contenedor efímero sin red/read-only; **no repitió** npm/Maven ni el despliegue completo.

### Incidentes y límites conservados

- Primer intento real: capturador exit1 porENOSPC en/tmp tmpfs3.9GiB100%;stdout/stderr0bytes yexit/etapa del script irrecuperables. No se atribuye a npm,Maven oDocker ni se declaraPASS.
- El humano eligió «Pausar; yo libero espacio en /tmp». Tras «Ya quedo liberado, el espacio»,había1.4GiB;la continuación se detuvo enpreflight sinbuild/copias nuevas,al no poder cuantificar el tamaño final de620entradas del lock. No fue otro despliegue fallido.
- Después el humano autorizó específicamente `/home/dark/projects/museum-compose-proof` para una única prueba con temporales/cachés en disco. Ese intento real aprobó. No se borró /tmp ni se limpiaron scratches o volúmenes existentes.
- Se conservan el directorio autorizado y el scratch previo `/tmp/museum-independent-Kuyqvu`; la fixture durable `museum_diskproof_20261024_data` sigue presente. Los contenedores y red propios fueron retirados sin-v. La imagen de prueba de licencias tampoco se eliminó.
- El primer Dockerfile frontend omitía `3rdpartylicenses.txt`, generado fuera de`browser`. El padre detectó el problema, observóRED y añadióCOPY/excepción; la verificación focalizada de imagen confirmó bytes/SHA idénticos al build. La evidencia del resto del stack permanece vigente.
- Shellcheck no está instalado y no se instaló; se usó sintaxis Bash y pruebas funcionales. Bundle643,82kB/aviso500kB permanece. npm informó cuatro scripts de instalación bloqueados, sin impedir build/runtime. Sin nueva auditoría; la pendiente previamente aceptada no se convierte en aprobación.
- ASSESS escalado por riesgo5 (entorno) ypreservación1: no evaluable por untracked, verificación independiente realizada, **sin aprobación nativa**. Estas comprobaciones no son CI remoto ni auditoría exhaustiva, tampoco prueba de navegador/UI nueva.

Evidencia ignorada: `/home/dark/projects/museum-compose-proof/logs/{result,license-proof}.json`,stdout/stderr,modelo,HTTP,health yteardown. Las instrucciones vigentes están en[README.md](README.md),[backend/README.md](backend/README.md) y[frontend/README.md](frontend/README.md).

## Historial: revisión TanStack Query y DI soportada

T5 ejecutada **después** del cierre backend, por pedido humano. En Angular21.2.25/TanStack5.104.5 la declaración instalada `inject-query-client.d.mts:8` marca `injectQueryClient` deprecado y prescribe `inject(QueryClient)`; su implementación resolvía el mismo token. Se reemplazaron únicamente las dos inyecciones productivas de catálogo/perfiles, preservando proveedor, claves, callbacks, políticas, transporte y el orden de imports concurrente.

**Veredicto:** uso adecuado para metadatos del MVP. Cliente raíz único con mount/unmount; claves estructurales estables; consultas como Promise con AbortSignal hasta fetch; mutaciones separadas, invalidación de perfiles onSuccess y catálogo onSettled; sin cache de registros biológicos ni persister. No hay requisito automático de `enabled` para lecturas globales sin parámetros ni de migrar a HttpClient. Ver [QUERY_USAGE.md](frontend/QUERY_USAGE.md) para rutas/versiones y salvedades de errores/refetch.

| Prueba nueva | Resultado |
|---|---|
| RED esperado, producción intacta |1fallo/9pases: guarda de clase compilada detecta `injectQueryClient`; las nueve pruebas funcionales ya aprobaban |
| GREEN tras DI equivalente |10/10focalizadasPASS |
| Suite/build del writer |99pruebas/11archivosPASS,buildPASS; warning643,82kB/500kB intacto |
| Contraste del padre |Nodechecker+10/10focalizadas+diffcheckPASS,8s; sin cambio productivo adicional |

Los diez casos cubren identidad del cliente, ciclo de vida, cuatro acciones de perfiles y cuatro resultados de sincronización con refetch real sobre API simulada. La ausencia del alias necesita una guarda estructural porque ambas funciones DI tienen comportamiento equivalente. No se inventó una diferencia funcional para conseguir RED.

El primer writer terminó parcial: dos errores de hoisting con0tests y una ejecución10/10fallida por metadataApp sin compilar; no eran RED válido. Tras «Review the delivered subagent output and continue.», una corrección acotada registró imports standalone, setup asíncrono y `await TestBed.compileComponents()`, sin relajar assertions/timeouts ni cambiar producción para ocultar fallos. Después observó el RED específico y los pases anteriores. Sin API viva, navegador, instalación/audit, cambios backend o dependencias nuevos. ASSESS no evaluable por untracked, plan selfVerification cumplido, sin aprobación nativa.

Comandos: `npm test -- --watch=false --runner-config ../.browser/frontend-architecture/vitest.serial.config.mjs --include=src/app/testing/query-usage.spec.ts` (RED/GREEN y contraste); suite sin include; `node scripts/check-architecture.mjs`; `npm run build`; `git diff --check`. Las salvedades existentes (refetch de perfiles no esperado por el callback, escritura ambigua ante fallo de red, abortos convertidos en error genérico) quedan documentadas, no corregidas subrepticiamente ni consideradas requisitos nuevos.

## Historial: backend hexagonal preservador

**Resultado:** `profile` y `catalog` tienen núcleo Java puro (`domain`, `application`), puertos, adaptadores y composición Spring explícita. Perfil conserva una transacción por operación completa; catálogo conserva la descarga fuera de transacción y la activación contra el snapshot bloqueado. No cambian esquema, recursos, dependencias, contrato HTTP ni datos vivos. Skills instaladas utilizadas: hexagonal-architecture, Java, Spring Boot, JPA, TDD y verificación Spring.

| Comprobación nueva | Resultado observado |
|---|---|
| Baseline antes de migrar | Job1:68/68tests,0fallos/errores/omisiones;50observaciones públicas guardadas |
| Núcleos | Ambos compilados mediante `javac` sin frameworks por writers/verificadores |
| Arquitectura | REDexit1 sobre paquetes antiguos→GREEN tras extracción;5regresiones del checkerPASS |
| Perfil independiente |92testsPASS y50/50observaciones idénticas; sonda adicional93PASS comprueba proxy real y rollback SQL completo |
| Catálogo independiente |65testsPASS, incluidas8/8carreras mixtas, transporte, estado durable y reinicio con PostgreSQL desechable |
| Integración padre | **Job3:160/160tests**,0fallos/errores/omisiones,8clases realmente ejecutadas; **packagePASS** |
| Diferencial padre | **50/50observaciones idénticas**: estado, cuerpo como cadena exacta y encabezados; no se normalizaron diferencias para ocultarlas |
| Recursos/contratos | `git diff` vacío para `backend/pom.xml`, `backend/src/main/resources` y `sources/tdwg`; sin nuevas migraciones ni dependencias |

Las tres sondas independientes incorporadas son `lifecycleOperationsUseOneTransactionalProxy`, `bootstrapDatabaseConflictRollsBackEarlierSeeds` y `CatalogLockedCurrentPolicyTests`. La primera comprueba un solo bean proxificado, transacciones REQUIRED y read-only únicamente en listado; las otras fijan rollback total ante conflicto SQL y conservación frente a un candidato descargado antes que el snapshot vigente. Se agregan a las integraciones PostgreSQL, no las sustituyen por mocks. Perfil94+catálogo66=160; no sumar ejecuciones independientes ni históricos para inflar ese total.

### Comandos y artefactos

Desde raíz: `python3 -B backend/scripts/test_architecture.py`, `python3 backend/scripts/check_architecture.py`, `git diff --check`. Desde backend: `bash ./mvnw test && bash ./mvnw package -DskipTests` (job3). El segundo comando omite pruebas porque el primero acaba de ejecutarlas; no describe una suite omitida. El baseline y el candidato generan las observaciones `PROFILE_CONTRACT` mediante MockMvc con reloj fijo/UUID normalizados. Artefactos ignorados: `.browser/backend-hexagonal/{baseline-contract,final-contract}.jsonl`.

Unidades locales: perfil `a9d783c` (734+/185-), catálogo `16baee4` (765+/191-). Son extracciones verticales con sus pruebas y docs, no commits por tipo de archivo. Superan la heurística400 por cohesión; no se minificó ni omitió código para reducir el conteo. Primera unidad comprobada independientemente contra el catálogo anterior; no necesita una mitad futura para compilar.

### Fallos, consentimiento y límites

- Job2 no aprobó:157tests,0fallos de aserción,61errores de contexto. Quedaban `.class` antiguos junto a los reubicados, produciendo `ConflictingBeanDefinitionException` entre ambos `CatalogConfiguration`. Se archivaron `target/classes` y `target/test-classes` en `.browser/backend-hexagonal/stale-compiled-20261024-021348`, sin borrados ni tocar JAR/runtime; job3 reconstruyó y aprobó. No fue un timeout reintentado ni se debilitó una prueba.
- Un postcheck inicialmente sumó todos los XML Surefire y obtuvo186 por26informes históricos ajenos a esta ejecución. Falló su aserción; se corrigió contrastando las ocho clases del log actual con sus XML. El total nuevo real es160, no186. No se reejecutó Maven para corregir el contador.
- El escritor de catálogo informó parcial por diez ubicaciones físicas antiguas, aunque ya declaraban paquetes nuevos. El padre las reubicó sin sobrescribir destinos; checkerGREEN y verificación posterior cubren el resultado final.
- Preparación destructiva del scratch de perfil fue bloqueada antes de ejecutarse. Se usó archivo baseline separado y tar con exclusiones, sin borrados. La autorización humana posterior permite a verificadores leer/copiar **solo** `/home/dark/.m2/wrapper` y `/home/dark/.m2/repository` a su scratch, sin red, credenciales, settings ni escritura original. El catálogo había quedado pendiente de ese consentimiento: su continuación ejecutó Maven por primera vez, no reintentó un test fallido.
- El verificador de catálogo informó posible escritura externa de preferencias JShell antes de fijar `java.user.home`; no se inspeccionó ni limpió una ruta externa ni se inventa resolución. La ejecución Maven posterior confinó HOME, temporales, caché y preferencias al scratch. Los scratches comunicados por trabajadores/verificadores se conservan; no hay autorización de limpieza externa.
- GET opcional al runtime8080 agotó10s **antes** de cambios; `ss` confirmó ausencia de listener. No se reinició runtime ni se compararon nuevamente los nueve perfiles vivos. La nueva evidencia funcional proviene de PostgreSQL aislado y comprobación de recursos/esquema inalterados; no se tocó la base viva ni la original.
- ASSESS escalado por riesgos1/4, también por cada rango de commit, sigue no evaluable por untracked: verificación independiente requerida y cumplida, **sin aprobación nativa**. No se instalaron SpotBugs/PMD/Checkstyle/JaCoCo/OWASP ni se afirma cobertura o auditoría de seguridad. Auditoría npm pendiente aceptada permanece intacta. Sin push/PR.

Ver [backend/README.md](backend/README.md), [perfiles](backend/PROFILE_ARCHITECTURE.md) y [catálogo](backend/CATALOG_ARCHITECTURE.md). La petición posterior de revisar `injectQueryClient` y TanStack Query se registra como T5; no forma parte de estos commits ni de esta aceptación backend.

## Historial: arquitectura frontend y sistema de diseño integrados

**Resultado funcional comprobado:** frontend por funcionalidades `catalog`, `profiles`, `importer`, modelos con propietario único, transporte/i18n en `core`, selector en `shared/ui` y sistema de diseño real en `shared/design-system`. Componentes grandes con HTML externo; no quedan rutas antiguas ni barrels de compatibilidad. `src/styles.scss` importa primitivas y especializaciones en orden explícito. `MuseumPreset` y CSS consumen una sola paleta; shell/primitivas usan tokens semánticos, espacios y radios. No se cambió API, parser, validación, dependencias ni datos.

### Unidades y evidencia

| Unidad | Evidencia observada |
|---|---|
| Baseline UI | `a0e6ca9`: RED3fallos/10pases→13/13focused y navegador S4–S6. Job48suite83/84 agotó hook10s; build omitido. Solo tras autorización humana explícita, job49 serial84/84+buildPASS sin ampliar límites ni cambiar aserciones. |
| Empaquetado | `491397d`: writer estructuralNode0/diffcheck0, sin Angular. Padre transfirió su patch frontend del worktree aislado, reejecutó checker y contrastó ocho cuerpos de motor/API/i18n/picker idénticos salvo imports contra baseline. Tres ejemplos originales byte iguales. |
| Sistema de diseño | `f838b81`: writer extrajo SCSS/preset y escribió cinco tests; no los ejecutó. El padre integró preset/shell y ejecutó realmente esos cinco junto a la suite. |
| Costura integrada | **Job50: checkerNodePASS,20/20focalizadas,89/89suite frontend ybuildPASS**, con runner local secuencial. Worker de62,17kB emitido. Bundle643,88kB/500kB: advertencia, presupuesto intacto. |

No se inventó RED para movimientos preservadores. Las unidades de extracción superan400líneas por mover bloques cohesivos con pruebas/docs; no se minificó para reducir el diff. El checker `node scripts/check-architecture.mjs` usa solo Node y protege ubicaciones, imports/recursos, dirección de dependencias, contratos únicos y URL del worker; no reemplaza pruebas ni navegador.

### Navegador posterior al refactor

Chromium real mediante CLI existente, sesión `museum-architecture-final-01a16167`,1440×1000 y390×844, **cerrada**. Solo controles públicos y lecturas DOM; sin inyección de estado ni respuestas simuladas.

- Worker realmente carga desde su nueva ubicación: CSV inválido con combinado27errores+1advertencia, CSV válido0/0, XLSX `Complete`1registro/30columnas0/0. Se eligió hoja con teclado nativo. Volver a mapeo y al diagnóstico conservó el resultado.
- Descargas JSON/CSV contienen las mismas28incidencias, con filas de origen; contraste completo tras convertir representación CSV de fila a número/null.
- Selección de equivalencia: relleno/borde `rgb(25,76,58)`, texto blanco y sin sombra interior; foco de input sin outline, fila resaltada, separadores de1px y sin zebra. Etiqueta específica de hoja conservada.
- Perfil publicado Museo+SiB: todas las entradas/selectores/textarea deshabilitados, selector con `catalogNumber`; diálogo cerrado sin guardar. Nueve perfiles completos iguales antes/después, incluidos tres borradores; sin eliminación/ocultamiento.
- Sincronización móvil real: pendiente con spinner→SUCCESS. Botón238×44,09375px y región de estado112px con **rectángulos completos idénticos** en los tres estados. Selectores44,09375px/14px; documento390px, sin desbordamiento global y pie separado del main. HAR manual:1POSTvacío+GET.
- HAR del análisis CSV/XLSX:8GET, sin cuerpos ni nombres de los tres archivos en solicitudes, sin subidas. No se usa status0 deHAR como prueba de HTTP200; el éxito de sincronización se observó en UI y su respuesta de operación.
- Registro de errores de página vacío. Capturas abiertas e inspeccionadas: `screenshot-1792782980782.png` (mapeo escritorio), `screenshot-1792783072082.png` (publicado), `screenshot-1792783073209.png` (carga móvil), `screenshot-1792783091759.png` (mapeo móvil). Resumen machine y artefactos en `.browser/frontend-architecture/final/`, ignorados porGit.

Comandos realmente usados: `node scripts/check-architecture.mjs`; `npm test -- --watch=false --runner-config ../.browser/frontend-architecture/vitest.serial.config.mjs` (con includes focalizados antes de suite completa); `npm run build`. CLI con `--session museum-architecture-final-01a16167 --screenshot-dir /home/dark/projects/universidad/.browser/frontend-architecture/final --download-path` en ese directorio: upload de ejemplos mediante input público, selección de perfil, clics en pasos/equivalencias, foco/hover, `download`JSON/CSV, `network har start/stop`, hoja mediante ArrowDown/Enter, publicado/cierre explícito, sincronización y `close`. Evaluaciones de lectura midieron cajas/estilos/disabled, nunca mutaron estado de aplicación.

### Incidentes y límites preservados

Primer explorador agotó4min trasfind, sin mapa. Un único intento acotado autorizado entregó evidencia limitada, luego contrastada. Primer dispatch del escritor de empaquetado fue rechazado antes de crear tarea por intersección conservadora de globs; no se ignoró la guardia: se creó/registró un worktree del mismo clon en `.browser/worktrees/frontend-packaging`. Sus cambios frontend se trasladaron mediante patch; ese worktree auxiliar conserva su copia/staging, sin limpieza destructiva ni instalación de dependencias. La copia de registro allí no es autoridad del feature: el registro canónico es `odd/tasks/frontend-architecture.md` en la raíz.

El timeout job48 permanece como fallo observado; no demuestra defecto productivo ni su causa se deduce solo de carga/swap del host. Job49 fue exactamente la ejecución adicional autorizada. El runner temporal solo limita paralelismo; no aumenta timeouts ni omite pruebas. Los resultados del baseline no se atribuyen a los writers ni sustituyen job50.

ASSESS de writers y rangos committedOnly de ambas unidades siguió no evaluable por untracked: plan de verificación propia, sin revisión/aprobación nativa. No nueva auditoría; la auditoría previamente agotada sigue pendiente aceptada. Backend y semillas no se reejecutaron porque no cambiaron. No push/PR ni archivos ajenos modificados, tampoco limpieza de capturas/scratchs externos históricos.

## Historial: baseline visual previo a reorganizar frontend

T1 de `odd/tasks/frontend-architecture.md`: etiqueta «Seleccione la hoja de cálculo que desea analizar»; equivalencia seleccionada con fondo y borde `rgb(25,76,58)`, texto blanco y `box-shadow:none` incluso en hover; input y selector enfocados sin outline amarillo, conservando borde verde, resaltado de fila y foco de teclado en botones/enlaces.

REDjob47:3fallos/10pases. Job48:13/13focalizadas, pero suite83/84 con timeout10s en preparación de app.spec; comandoexit1 tras4m44 y build no ejecutado por&&. No se reintentó automáticamente. Diagnóstico de metadatos del host mostró carga alta y swap llena, sin demostrar causalidad. Usuario autorizó exactamente un intento secuencial (`authorize_one_serial_frontend_suite`), con maxWorkers1/fileParallelismfalse y sin ampliar límites o cambiar aserciones. **Job49:84/84 ybuildPASS**,15s. Configuración local temporal `.browser/frontend-architecture/vitest.serial.config.mjs`, no configuración del producto. Warning640,61kB/500kB conservado.

Chromiumreal1440×1000, acciones públicas: CSV de ejemplo, perfil combinado, mapeo, selección de equivalencia, hover y foco de input; XLSX y espera de etiqueta exacta. Medidas `.browser/frontend-architecture/t1-selection.json` y `t1-focus.json`; captura `screenshot-1792781196092.png` abierta e inspeccionada. Sesión propia `museum-architecture-01a16167` cerrada, sin guardar perfiles. Modelo API/worker y dependencias intactos; no repetir backend/semillas para estas reglas de presentación.

ASSESS no evaluable por untracked; plan de verificación propia, sin revisión/aprobación nativa reclamada. La reorganización T2/T3 y la aceptación final T4 aún están pendientes en el registro, no se presentan como terminadas aquí. Sin nueva auditoría ni push/PR; archivos ajenos preservados.

## Historial: bordes de mapeo suavizados

Últimas correcciones solicitadas: sin fondos alternos; separadores horizontales **1px**, borde izquierdo de `source-header` **1px**, resaltado al enfocar y pasar el cursor conservado. README y regresión CSS actualizados; sin cambios de lógica, datos o backend.

Pruebas: job43 RED1fallo/8pases→job44GREEN9/9+81/81/build; el pedido adicional del borde izquierdo produjo job45 RED1fallo/8pases→**job46 final9/9focalizadas+81/81suite ybuildPASS**. Warningbundle640,57kB/500kB, presupuesto intacto. Backend/semillas no repetidos por ser presentación localizada.

Chromium real: dos filas blancas en reposo; enfocar el input de la primera produce `rgb(226,238,230)` solo en esa fila, dejando la segunda blanca. Bordes izquierdo e inferior medidos1px. Capturas `.browser/mapping-soft/screenshot-1792768395065.png` (antes del ajuste izquierdo) y `screenshot-1792768534534.png` (final), ambas abiertas e inspeccionadas; `neutral.json`, `focused.json`, `left-final.json` conservan las medidas. Acciones públicas: cargar CSV de ejemplo, elegir perfil, ir a mapeo y enfocar input; evaluaciones DOM de lectura, sin inyectar estado ni guardar perfiles. Sesión propia `museum-mapping-soft-01a16167` cerrada.

RDD on; ASSESS no evaluable por untracked, plan de verificación propia sin independiente; sin aprobación nativa. Sin nueva auditoría, commit/push/PR ni cambios en archivos ajenos.

## Historial: separación, selectores, TDWG y paginación

Cambio frontend posterior a la distribución compacta; conserva sus ajustes y no modifica backend, dependencias, API, validación ni los nueve perfiles.

| Pedido | Comprobación observada |
|---|---|
| Separar encabezados | Filas de mapeo con fondos alternos, separador2px y realce al pasar el cursor/enfocar. Encabezado de origen una sola vez en cabecera, sin repetir «Origen» en cada fila. Captura escritorio abierta e inspeccionada. |
| Estandarizar listbox | Nativos, PrimeNG y paginadores:44,09375px de altura,14px de tipografía,borde `rgb(174,191,182)` y radio5px, medidos en catálogo. Tokens compartidos para foco, deshabilitado y opciones PrimeNG. No se migraron los controles nativos: su ventana de opciones depende del navegador/SO. |
| Mejorar TDWG | Acción junto al encabezado/contador, filtros separados, icono/spinner y región de estado permanente. Móvil390×844: botón **238×44,09375px** y estado **112px** con rectángulos completos idénticos en reposo, pendiente y éxito; documento390px. `pending:true`,spinner observado y éxito real. HAR final:1POST `/api/catalog/sync` sin cuerpo+GET. |
| Cantidad por tabla | Catálogo15→30 filas visibles; mapeo12→25; normalización10→25 de30cambios; diagnóstico20→28 al elegir50; perfiles seleccionados25 con9filas. Cantidades iniciales anteriores conservadas. |

La normalización se ejerció con una copia local del CSV válido, agregando espacios a sus30celdas, sin modificar el original. El recorte explícito produjo30cambios y0errores/0advertencias. CSV erróneo con combinado:27errores+1advertencia antes/después de elegir50. Nueve perfiles completos iguales en GET antes/después; registro de errores de página vacío. Sesión propia `museum-consistency-01a16167` cerrada.

**Pruebas:** job39 RED4aserciones fallidas por funciones ausentes,15pases y una prueba nueva que agotó5s; ese timeout es un fallo, no se lo presenta como RED funcional confirmado ni se aumentó el límite. Tras implementar el candidato nuevo, job40 aprobó20/20focalizadas,80/80suite/build. La inspección real detectó dos defectos adicionales: etiqueta TDWG partida con salto de altura53,75→44,09px y fuente nativa12,88px frente14px del paginador. Se fijaron regresiones: job41 RED2fallos/7pases; corrección de altura/ancho fijos, nowrap y tipografía común. **Job42 final:9/9focalizadas,81/81suite ybuildPASS**. Bundle640,84kB frente500kB: advertencia sin cambiar presupuesto. Backend y semillas no se reejecutaron porque no se tocaron.

**Incidentes de automatización, no pases:** primera evaluación tras HMR buscó el botón en una sección distinta; se navegó a catálogo y esperó el control. Un intento de cantidad en preview vacío no abrió opciones porque estaba deshabilitado; se comprobó luego con30cambios reales. Una búsqueda de opción50 fue anterior al montaje del overlay; se esperó su estado observable. Un selector demasiado amplio apuntó al workbench oculto al navegar a perfiles y recibió clic cubierto; se acotó a `app-profiles`. No hubo inyección de estado, simulación de respuestas ni escrituras de perfiles.

Comandos del candidato final: `cd frontend && npm test -- --watch=false --include=src/app/layout.spec.ts && npm test -- --watch=false && npm run build`. Navegador existente con sesión propia y `--screenshot-dir /home/dark/projects/universidad/.browser/control-consistency`; `network har start/stop`, clic en sincronizar, lecturas DOM de cajas/estilos, espera de botón habilitado; en paginadores, clic en `.p-paginator-rpp-dropdown .p-select-dropdown`, espera de `[role=listbox] [role=option]` y selección por nombre. Para perfiles se acotó a `app-profiles`. Archivos cargados únicamente mediante input público; se cerró la sesión con `close`.

Evidencia local ignorada: `.browser/control-consistency/` conserva geometrías, cantidades, HAR y perfiles. Capturas abiertas: `screenshot-1792762006303.png` (filas escritorio), `screenshot-1792762212426.png` (catálogo móvil corregido), `screenshot-1792762304388.png` (pendiente final), `screenshot-1792762305755.png` (mapeo móvil). Las primeras capturas desktop de sincronización documentan el candidato previo a corregir la altura, no son prueba del tamaño final.

RDD sigue on; ASSESS final no evaluable por untracked, plan de verificación propia sin verificador independiente. No se inició revisión ni se afirma aprobación nativa. Sin nueva auditoría, commit/push/PR ni modificación de archivos ajenos. README actualizado; límites y comprobaciones históricas quedan separados debajo.

## Historial: distribución compacta y main expandible

Cambio exclusivamente frontend posterior a `6936cd3`; no reabre las tareas anteriores ni modifica API, parser, validación, dependencias o perfiles.

- `main` mantiene el mínimo anterior y crece verticalmente con el contenido. Chromium1440×1000: antes/después corto **1150×853,21875px** exactos; mapeo largo **969,4375px** de alto. Ancho de documento1440 en viewport1440. El pie sigue el flujo debajo del contenido.
- Reglas: seis campos en **tres columnas/dos filas** en escritorio; botón «Eliminar regla» debajo sin cambio. Móvil: una columna, diálogo362px dentro de viewport390px. Perfil nuevo de comprobación descartado, sin guardar.
- «Colección biológica.» es la primera opción de contexto; ninguna opción queda preseleccionada por este cambio. Combinación/exclusividad y claves del worker conservadas.
- Mapeo: destino y «Limpiar» pequeño en el mismo eje; todas las sugerencias en una franja horizontal a la derecha, sin prefijo «Usar». Filas medidas60,47px, botones31,5px. Cuando no caben, hay desplazamiento local; móvil tabla728px en región341px, documento390px/viewport390px. Selección de sugerencia y limpieza comprobadas en controles públicos.
- Excel: margen superior medido **14px** entre selector y acción de lectura. Hoja `Complete` elegida con teclado nativo y leída:1registro/30columnas.
- CSV erróneo, perfil combinado y Otros:27errores+1advertencia. GET perfiles antes/después: mismos nueve objetos completos. Sin errores registrados de página. Sesión propia `museum-compact-01a16167` cerrada.

**Pruebas nuevas observadas:** RED9fallos/5pases; primer intento GREEN13pases/1fallo por regex que omitía los atributos de encapsulación Angular del CSS compilado. Corregida únicamente esa aserción manteniendo la comprobación de ancho automático. Resultado: **14/14 focused y76/76 suite frontend**, buildPASS (job38). Advertencia de bundle inicial636,88kB frente500kB; no se modificó el presupuesto. Backend y semillas no se reejecutaron: no se cambió su comportamiento ni código. No convertir la suma con resultados históricos en una suite nueva.

**Límite de automatización:** `agent-browser select ... Complete` informó éxito, pero la primera lectura resultó2registros/6columnas de `With errors`; esa captura no prueba lectura de `Complete`. Después, con teclado ArrowDown/Enter sobre el selector nativo, el valor observado fue `Complete` y la lectura1×30. No se cambió el producto para acomodar la herramienta. Una lectura de diagnóstico tomada durante «Procesando localmente» tampoco se contó como resultado: después se esperó «27 errores» y se capturó el diagnóstico concluido.

Comandos de pruebas:

```bash
cd frontend
npm test -- --watch=false --include=src/app/layout.spec.ts --include=src/app/app.spec.ts --include=src/app/evolution.spec.ts
npm test -- --watch=false
npm run build
```

Navegador existente, sin instalar/actualizar; `--session museum-compact-01a16167 --screenshot-dir /home/dark/projects/universidad/.browser/compact-layout`, ejecutable Chromium del proyecto. Se usaron `upload 'input[type=file]' .../examples/records-with-errors.csv`, `check @e13`, `click @e20`, selección/limpieza, `set viewport 390 844`, contexto/Otros/validación; luego «Crear perfil»/«Agregar regla»/«Cerrar editor» sin guardar. Para Excel: `focus '.upload select'`, `press ArrowDown`, `press Enter`, `get value '.upload select'`, clic en «Leer la hoja seleccionada», `wait --text '30 columnas'` y `close`. Evaluaciones DOM exclusivamente de lectura midieron cajas/estilos; no se inyectó estado ni se simularon respuestas.

Artefactos locales ignorados por Git: `.browser/compact-layout/` contiene baseline, geometrías, nueve perfiles antes/después, diagnóstico, lectura XLSX y errores. Capturas abiertas e inspeccionadas: `screenshot-1792730139787.png` (mapeo escritorio), `screenshot-1792730173703.png` (móvil), `screenshot-1792730219666.png` (regla3×2), `screenshot-1792730247578.png` (selector XLSX móvil; el margen del botón se prueba con geometría, no con su visibilidad en ese recorte).

RDD sigue on; ASSESS devolvió `unassessable` por archivos untracked y plan de verificación propia, sin verificador independiente. No se inició revisión nativa ni se afirma aprobación. No nueva auditoría. Archivos ajenos, datos y perfiles intactos; sin push/PR.

## Historial: refinamiento Java/JPA e importación

**Aceptación funcional comprobada por el padre:** separación DTO/JPA, progreso navegable, selector único, marco estable y sincronización manual. Los nueve perfiles, incluidos tres borradores, permanecen íntegros y visibles; no hubo eliminación ni ocultamiento. Registro: `odd/tasks/museum-refinement.md`.

### Pruebas y atribución actuales

| Unidad | Evidencia observada |
|---|---|
| T1, S1–S7 | `724f167`: DTO `profile/dto/req` y `dto/res`, getters JavaBean, excepción `shared/exceptions`, Jackson `.asString()`, pruebas en `profile` con EntityManager. Escritor: 52 pruebas/paquete y 50 observaciones HTTP diferenciales; 41 rechazos conservaron perfiles completos. Independiente: 52/52, trigger real y concurrencia aprobados. |
| T2, S8–S11 | `12ae950`: escritor RED5→66/66 y build; preservación base62. Independiente: 66/66/build y sonda real Profiles/FormField67 candidato/62 base. Sonda exacta fijada en `5d77e84`; padre1/1. Geometría real y capturas contrastadas abajo. |
| T3, S12 | `bc7b139`: padre RED API24/7fallos por ruta inexistente y carrera que no pudo empezar; UI4fallos por botón ausente. GREEN59backend/paquete y UI4focused. Costura:6semillas+71frontend/build. Independiente:59/71,16 observaciones HTTP diferenciales exactas y12rechazos binarios con entidad intacta. Sin bloqueadores de producto. |
| Regresiones T3 | `923cc83`: padre fijó rechazo binario y ocho carreras usando estado público. Job34:9/9; job35: **68/68 backend**, sin omisiones. La suite frontend71 y semillas6 ya habían pasado en job30. **Total actual:145 pruebas (68+71+6)**; build Angular y paquete Maven aprobados. No se repitieron las suites del verificador. |
| Límites | Bundle inicial636,27kB frente a objetivo500kB: advertencia, no se alteró el presupuesto. Auditoría npm pendiente aceptada, sin nuevo intento. ASSESS nativo no evaluable por archivos untracked; no hay aprobación nativa ni recibo reclamados. |

El verificador T1 tuvo una primera suite con exit1:45 contabilizadas/37errores/8aprobadas antes de iniciar DB/MockMvc, por `TESTCONTAINERS_PULL_POLICY=org.testcontainers.images.NeverPullPolicy` inexistente. Se autorizó una sola corrección del harness: retirar esa variable y ejecutar la misma suite, sin cambiar código/aserciones; exit0,52/52. Package ya había aprobado y no se repitió.

El verificador T3 observó una sonda extra10casos/1fallo: comparaba la semilla JSON indentada con la serialización compacta después de una activación válida. No fue un defecto reproducido del producto. Sus otras garantías de generación/resultado/contadores pasaron; no reejecutó la revisión. El padre adaptó las regresiones a GET públicos, comparando atributos JSON tras activación válida y bytes/metadatos tras intentos obsoletos, y observó9/9 y68/68 completos. No se presenta esa variante corregida como ejecución del verificador.

### Navegador real y conservación

Chromium existente mediante agent-browser0.39.1, sesión propia `museum-refinement-01a16167`, **cerrada al terminar**. Escritorio1440×1000 y móvil390×844. Solo controles públicos y lecturas DOM; sin inyección de estado Angular, datos simulados ni API mutada para aparentar éxito.

- Sin archivo: pasos futuros deshabilitados. Tras cargar/seleccionar el combinado, clic en pasos y Enter permitieron ir a mapeo/contexto/diagnóstico. Volver a mapeo y regresar conservó selección `catalogNumber`, archivo y diagnóstico27errores+1advertencia.
- Un input por picker; escribir `catalog` filtró a `catalogNumber`, `CatalogNumberNumeric`, `otherCatalogNumbers`; selección por opción aplicada. Texto `rgb(32,58,52)`, opacidad1. Panel estable326px/campo325,66px en escritorio; diferencia menor de1px también en móvil. Controles de edición/sugerencias44,09px de alto; paginación separada.
- Main de escritorio1150×853,22px tanto en mapeo largo como contexto corto; móvil mantuvo altura607,94px entre mapeo y diagnóstico. Documento390px en viewport390px. Footer fuera del área desplazable, sin superposición. Tablas y progreso requieren desplazamiento horizontal interno en móvil; no caben todas las columnas a la vez.
- Publicado Museo+SiB: input y limpieza deshabilitados, un solo campo por selector; diálogo dentro del viewport. Borrador: se escribió valor libre con espacios y se descartó sin guardar. No se afirma una auditoría exhaustiva de accesibilidad ni Escape universal desde cualquier subcontrol.
- Botón «Sincronizar con TDWG»: estado «Sincronizando…» deshabilitado, seguido por éxito real. HAR manual: un POST `/api/catalog/sync` sin cuerpo y un GET del catálogo; estado público posterior con más intentos,414términos/tresfuentes y sin fallo. Nueve perfiles completos iguales antes/después.
- CSV válido y XLSX `Complete`:0errores/0advertencias/0normalizaciones. CSV inválido, combinado y Otros:27errores+1advertencia. Descargas JSON/CSV:28incidencias equivalentes, filas originales. La navegación entre secciones conservó el diagnóstico válido.
- HAR de fase validación CSV y carga del CSV válido: tres GET, sin POST/cuerpos/nombres de esos archivos. No se usa el estado0 del HAR como prueba de HTTP200. XLSX se comprobó funcionalmente; no se afirma una captura HAR nueva de su carga.
- API final: nueve perfiles y tres borradores iguales al baseline completo; los tres ejemplos originales iguales byte a byte a HEAD. Registro de errores del navegador vacío.

Evidencia local (ignorada por Git): [resumen del padre](.browser/refinement-acceptance/parent-summary.json), [HAR manual](.browser/refinement-acceptance/manual-sync.har), [HAR local](.browser/refinement-acceptance/local-analysis.har), [JSON](.browser/refinement-acceptance/diagnostic.json), [CSV](.browser/refinement-acceptance/diagnostic.csv), [XLSX](.browser/refinement-acceptance/xlsx-complete-diagnostic.txt), [perfiles finales](.browser/refinement-acceptance/live-profiles-final.json). Capturas **abiertas e inspeccionadas**: [sincronización](.browser/refinement-acceptance/screenshot-1792726907007.png), [selector escritorio estable](.browser/refinement-acceptance/screenshot-1792727255460.png), [selector móvil](.browser/refinement-acceptance/screenshot-1792727494512.png), [diagnóstico móvil](.browser/refinement-acceptance/screenshot-1792727561747.png), [publicado móvil](.browser/refinement-acceptance/screenshot-1792727698133.png).

Extracto de comandos efectivamente usados; las refs pertenecen al snapshot de ese momento y no son identificadores estables de la aplicación:

```bash
B=/home/dark/.npm/_npx/6de2aa2fded2970c/node_modules/.bin/agent-browser
S=museum-refinement-01a16167
P=/home/dark/projects/universidad/.browser/refinement-acceptance
"$B" skills get core
"$B" --session "$S" --screenshot-dir "$P" --download-path "$P" --executable-path /home/dark/projects/universidad/.browser/chrome-headless-shell-linux64/chrome-headless-shell open http://localhost:4200
"$B" --session "$S" set viewport 1440 1000
"$B" --session "$S" find role button click --name 'Catálogo Darwin Core' --exact
"$B" --session "$S" network har start
"$B" --session "$S" find role button click --name 'Sincronizar con TDWG' --exact
"$B" --session "$S" network har stop "$P/manual-sync.har"
"$B" --session "$S" upload 'input[type=file]' /home/dark/projects/universidad/examples/records-with-errors.csv
"$B" --session "$S" download @e241 "$P/diagnostic.json"
"$B" --session "$S" set viewport 390 844
"$B" --session "$S" --screenshot-dir "$P" screenshot
"$B" --session "$S" close
```

### Incidentes de automatización actuales

Una evaluación inicial no encontró el panel y falló; se midió después con el selector DOM real y esperando el fin de la animación, sin cambiar producto. Hubo clics de navegación cubiertos por el encabezado del diálogo, una espera de25s agotada tras Escape con foco en un subcontrol y una ref `e10` caducada después de cambiar de sección. No se cuentan como pruebas aprobadas ni como defectos productivos: se utilizó cierre explícito, se confirmó DOM sin diálogo y se navegó con localizador semántico actualizado. El recorrido posterior y la conservación de datos sí fueron comprobados. No se relanzaron agentes ni auditorías por esos incidentes.

No se leyó, movió ni borró la captura externa de la aceptación anterior; tampoco se limpiaron scratches externos de los agentes desde el padre. No se afirma limpieza. Todos los screenshots de este refinamiento usaron `--screenshot-dir` dentro del proyecto.

## Historial: evolución del museo, aceptación integrada

**El recorrido integrado observado funciona con `Museo + SiB` 1.0.** El padre revisó el informe, las capturas internas de escritorio/móvil y los resúmenes; contrastó directamente JSON/CSV, HAR, archivos de origen y GET públicos. Aprobó 28 incidencias equivalentes (27 errores y una advertencia), dos GET sin cuerpos, nueve perfiles y estado TDWG intactos, tres archivos originales sin cambios y ausencia de errores registrados. Las suites y builds finales del padre aprobaron: **6 semillas + 51 backend + 61 frontend = 118 pruebas**. No se modificaron fuentes de producción, perfiles, dependencias ni procesos durante el recorrido de navegador; el cierre documental no agrega una auditoría ni aprobación nativa.

### Evidencia recibida del padre, no ejecutada nuevamente aquí

| Alcance | Resultado y procedencia |
|---|---|
| T1 / S1–S7, S10, S12–S13 | Commit `5b5562e`; 61 pruebas frontend y compilación aprobadas. CRUD real previo conservó los seis perfiles originales y textos arbitrarios; publicación bloqueada y duplicado independiente. |
| T2 / S11 | Commit `043a221`; verificación independiente de JPA aprobada, incluidos rechazos equivalentes y conservación de datos. |
| T3 / S9.1–S9.5 | Commit `56151d9`; verificación independiente finalmente satisfecha. El primer verificador no entregó dictamen; hubo autorización humana para un nuevo intento. El probe adicional falló inicialmente por falta de `@Import(CatalogSyncTests.Fakes.class)` en el harness, no por un defecto productivo. El rechequeo acotado pasó 1/1 con las mismas aserciones. |
| T4 / S8 y conjunto final | Commit `283645d`; job25 del padre terminó correctamente: 6 pruebas de semillas, 51 de API, 61 de frontend, empaquetado Maven y compilación frontend. Advertencia de tamaño: 634,97 kB frente al objetivo de 500 kB; no se alteró el límite. |
| TDWG real | Job27 del padre: 414 términos, tres fuentes oficiales del mismo commit `4b2c4f2dccaf1b3659877feef8d9e61176112fe5`, sin `lastFailure`; ocho perfiles anteriores intactos y nuevo compuesto exacto. Evidencia: [estado](.browser/evolution-live-catalog-status.json) y [nueve perfiles](.browser/evolution-live-profiles.json). |

La API usada por el navegador fue el runtime separado `backend/target/runtime-evolution/museo-evolution.jar`, ya iniciado por el padre en localhost:8080; Angular permaneció en localhost:4200. No se repitieron suites, builds ni auditoría. La sincronización real ya había ocurrido: no se provocó otra descarga TDWG.

### Recorrido ejecutado con navegador público

Se utilizó directamente agent-browser **0.39.1**, con el Chromium existente y la sesión propia `museum-final-20261022-accept`, cerrada al terminar. Escritorio: 1440×1000; móvil: 390×844. Solo se seleccionó el perfil combinado para los análisis. La normalización permaneció desactivada.

| Regla / prueba | Resultado observado |
|---|---|
| S8, S7: perfil combinado | Visible como publicado 1.0, 56 reglas. Diálogo de solo lectura, campos y picker deshabilitados; descripción española con límites de uso y procedencias Museo/SiB conservadas en su idioma original. No se repitió CRUD. |
| Diálogo escritorio/móvil | Capturas revisadas visualmente. En móvil mide 362 px dentro de 390 px; documento sin desbordamiento horizontal. Contenido con `overflow:auto`, desplazable hasta regla 56, cierre visible. Foco inicial en «Cerrar editor»; Tab permaneció dentro del diálogo; Escape lo cerró y devolvió el foco a «Ver reglas». No es una auditoría exhaustiva de accesibilidad. |
| CSV válido | `examples/museum-and-sib-valid.csv`: un registro, 30 columnas, **0 errores / 0 advertencias / 0 normalizaciones**, con Otros. Al probar antes Colección apareció una advertencia por la columna `disposition` ausente, coherente con la regla condicional; no se oculta esa diferencia de contexto. |
| XLSX existente | `examples/records.xlsx` contiene `With errors` y `Complete`; selección real por teclado de `Complete`: un registro, 30 columnas, **cero incidencias** con combinado y Otros. No se regeneró el libro. |
| S5: CSV inválido | `examples/records-with-errors.csv`, combinado y Otros: **28 incidencias = 27 errores + 1 advertencia**, no los 30 del recorrido histórico con dos perfiles. Son 24 incidencias de encabezado y cuatro de celdas: `scientificName` fila 3, `eventDate` fila 2, `decimalLatitude` fila 2 y `decimalLongitude` fila 3. Error con fondo rojizo, borde, mensaje destacado y texto «! Error»; advertencia con indicador propio. |
| Filtros y descargas | Búsqueda `scientificName` + severidad Error dejó una incidencia visible, fila 3. JSON y CSV descargados bajo el prefijo autorizado contienen las **28 incidencias**, iguales campo a campo y en orden, pese al filtro. Claves `field,row,description,severity,profile,version`, enumerados `ERROR/WARNING`, campos técnicos y filas originales intactos. Mensajes nuevos del compuesto en español. |
| Análisis exclusivamente local | HAR iniciado antes de cargar el CSV inválido y detenido después del diagnóstico: **dos GET** a `worker-JB32ZKYB.js?worker_file&type=module`; ningún POST, upload, `postData` ni cuerpo de solicitud. No aparecen nombre de archivo ni valores de celdas en las solicitudes. El HAR registra estado de respuesta 0: prueba el tráfico emitido, no se usa como prueba HTTP200. |
| S2–S4: mapeo | Origen destacado mediante fondo y peso 900; chips separados por 9,1 px. Clic en `Usar catalogNumber` activó `aria-pressed=true`; Limpiar lo retiró; selección `otherCatalogNumbers` desde picker actualizó el chip correspondiente. Duplicar destino desde `unknownField` mostró «Cada campo de destino puede usarse una sola vez.» y bloqueó continuar; se limpió esa asignación para continuar. No se creó fixture adicional. |
| S1, S13: contextos | Las cinco etiquetas coinciden literalmente con S1. Permiso, colección, muestreo y marinos se marcaron simultáneamente; Otros desmarcó los cuatro; marcar colección desmarcó Otros. Se probaron controles públicos, sin inyectar estado ni cambiar el contrato worker. |
| S6: footer | En contenido corto, footer estático en y967–1000, debajo de main que termina en y946. En listado largo (main de 1479,5 px), tras scrollY626, footer y967,28–1000,28, después de main; no superposición. Capturas revisadas también en diagnóstico móvil. |
| S10, S9: catálogo | Categorías con etiquetas, no URI. `Sin categoría` + `current` + búsqueda `associatedMedia` devolvió exactamente ese término; Restablecer volvió a 414. GET del catálogo confirmó 52 categorías vacías, sin inventar clases de reemplazo. Definiciones oficiales inglesas permanecen originales. |
| Navegación y conservación | Navegar a catálogo y perfiles y volver conservó archivo, diagnóstico 27+1 y filtro. GET públicos posteriores al análisis y mapeo coincidieron íntegramente con los nueve perfiles y el estado de catálogo del padre, incluidos hash activo, intentos y fechas. Los tres archivos originales coinciden byte a byte con HEAD. |
| Consola | Sin errores de aplicación ni excepciones de navegador registrados. Solo mensajes de desarrollo Angular/Vite y aviso NG0751 de carga anticipada de bloques diferidos con HMR. |

### Evidencia local y comandos

Los archivos de `.browser/` son evidencia local excluida de Git, no artefactos publicados. Resumen verificable: [probe-summary.json](.browser/evolution-final/probe-summary.json); [HAR](.browser/evolution-final/analysis.har), [JSON](.browser/evolution-final/diagnostic.json), [CSV](.browser/evolution-final/diagnostic.csv), [XLSX](.browser/evolution-final/xlsx-complete.txt), [filtro](.browser/evolution-final/errors-filtered.txt), [navegación](.browser/evolution-final/diagnostic-after-navigation.txt).

Capturas guardadas **y leídas visualmente**:

- [Diálogo escritorio estable](.browser/evolution-final/screenshot-1792703147111.png), [móvil](.browser/evolution-final/screenshot-1792703014528.png), [regla 56 tras scroll](.browser/evolution-final/screenshot-1792703034579.png).
- [Mapeo seleccionado](.browser/evolution-final/screenshot-1792703047278.png), [mapeo móvil](.browser/evolution-final/screenshot-1792702893084.png).
- [Diagnóstico móvil](.browser/evolution-final/screenshot-1792702987577.png), [filtro escritorio](.browser/evolution-final/screenshot-1792702988095.png), [CSV válido](.browser/evolution-final/screenshot-1792702964430.png), [XLSX válido](.browser/evolution-final/screenshot-1792702979995.png).
- [Footer corto](.browser/evolution-final/screenshot-1792703145490.png), [listado largo](.browser/evolution-final/screenshot-1792703145996.png), [diagnóstico/footer](.browser/evolution-final/screenshot-1792703100208.png).

Selección de comandos efectivamente usados, no un script completo de reproducción (variables muestran el ejecutable y sesión exactos; refs corresponden al snapshot de ese momento):

```bash
B=/home/dark/.npm/_npx/6de2aa2fded2970c/node_modules/.bin/agent-browser
S=museum-final-20261022-accept
"$B" --version
"$B" skills get core
"$B" --session "$S" --executable-path /home/dark/projects/universidad/.browser/chrome-headless-shell-linux64/chrome-headless-shell --download-path /home/dark/projects/universidad/.browser/evolution-final open http://localhost:4200
"$B" --session "$S" snapshot -i
"$B" --session "$S" network har start
"$B" --session "$S" upload 'input[type=file]' /home/dark/projects/universidad/examples/records-with-errors.csv
"$B" --session "$S" find role button click --name 'Validar localmente' --exact
"$B" --session "$S" wait --text 'Descargar JSON'
"$B" --session "$S" network har stop /home/dark/projects/universidad/.browser/evolution-final/analysis.har
"$B" --session "$S" fill @e1552 scientificName
"$B" --session "$S" download @e1547 /home/dark/projects/universidad/.browser/evolution-final/diagnostic.json
"$B" --session "$S" download @e1548 /home/dark/projects/universidad/.browser/evolution-final/diagnostic.csv
"$B" --session "$S" set viewport 390 844
"$B" --session "$S" screenshot --screenshot-dir /home/dark/projects/universidad/.browser/evolution-final --json
"$B" --session "$S" scroll down 29000 --selector .p-dialog-content
"$B" --session "$S" press Escape
"$B" --session "$S" wait --fn '!document.querySelector("[role=dialog]")'
"$B" --session "$S" console
"$B" --session "$S" errors
"$B" --session "$S" close
```

Las interacciones, esperas corregidas, descargas, HAR y cierre terminaron correctamente. El probe Python estándar comparó los GET públicos, exportaciones CSV/JSON y bytes de HEAD; terminó con código 0 y dejó el resumen enlazado. No hay RED significativo para documentación pasiva: se hizo comprobación funcional y lectura estructural, sin afirmar pruebas automatizadas nuevas.

### Incidentes de automatización y límites actuales

- `wait --text 'Diagnóstico de la colección'` agotó 25 s: el título real es «Diagnóstico». Se corrigió la espera a «Descargar JSON»; el diagnóstico ya existía. No fue una avería de análisis.
- Algunos selectores supuestos no existían (`input[type=checkbox][value=other]`, `input[aria-label="Buscar incidencias"]`) o un diálogo todavía estaba animando al intentar navegar. Se usaron snapshots y espera de desaparición del diálogo. El intento final de limpiar búsqueda no se ejecutó: el filtro permaneció activo, declarado en las capturas.
- Intentar continuar con destino duplicado dejó el botón deshabilitado, por lo que una espera posterior de diagnóstico agotó 25 s. Al limpiar **unknownField**, desapareció el conflicto y se completó el análisis. Limpiar solamente catalogNumber no quita su destino implícito original; esto no se presentó como un fallo productivo.
- La CLI aceptó inicialmente rutas posicionales de screenshot pero guardó por defecto fuera del proyecto. Ruta externa conocida reportada por el worker: `/home/dark/.agent-browser/tmp/screenshots/screenshot-1792702857070.png`; podría haber otras capturas iniciales en esa ubicación predeterminada. Se informó al padre, que no leyó, movió ni borró esos archivos. Su limpieza requeriría autorización específica y no se presenta como realizada. El formato corregido `--screenshot-dir` guardó las capturas posteriores dentro del prefijo autorizado. Una captura temprana también tomó el diálogo durante animación: se conservó como evidencia no concluyente y se sustituyó por la captura estable enlazada.
- En móvil, tablas, progreso y navegación usan desplazamiento horizontal interno; se observa recorte de columnas fuera de su viewport, sin desbordamiento horizontal global. No se afirma que todas las columnas quepan simultáneamente en 390 px. No se revalidó cada caso T1, CRUD de perfiles, todos los contextos biológicos ni todas las opciones del catálogo.
- No se atribuye a este navegador la verificación arquitectónica S11/S12 ni toda la sincronización S9: su respaldo está en T1–T4 y en los resultados del padre/independientes descritos arriba. No se reclama aprobación nativa ni auditoría aprobada.

## Historial previo a la evolución

Las secciones siguientes conservan resultados y fallos anteriores; sus conteos y bloqueos no describen el estado integrado actual.

La entrega funcional fue aceptada explícitamente con la auditoría de dependencias pendiente: **«Si acepto.»**. Esa aceptación no transforma un timeout en una auditoría aprobada ni autoriza reintentos. La traducción posterior al español se registra como trabajo adicional, con comprobaciones propias al final de este documento.

No se afirma aprobación de revisión nativa, publicación remota ni despliegue de producción.

## Comprobaciones observadas

| Comprobación | Resultado |
|---|---|
| Datos iniciales sin conexión | 3/3 aprobadas; el RED inicial correspondió a recursos todavía inexistentes |
| API pública sobre PostgreSQL aislado | 20/20 aprobadas antes de traducir; la suite posterior de idioma tiene 21/21 aprobadas; paquete Maven correcto |
| Verificación independiente del backend | Las nueve pruebas originales aprobaron; pruebas HTTP adicionales detectaron dos fallos de validación de entradas |
| Rechequeo acotado de correcciones | 11/11 aprobadas en PostgreSQL nuevo: enumerados numéricos y cuerpos de publicación no vacíos se rechazan sin escrituras; publicación sin cuerpo aprobada |
| Frontend previo a la traducción | 49/49 aprobadas por el padre y el verificador independiente |
| Frontend en español | 56/56 aprobadas por el worker y por el padre; compilación de producción aprobada |
| Tamaño del frontend en español | 633,88 kB iniciales: advertencia sobre el objetivo de 500 kB, por debajo del límite de error sin modificar de 1 MB |
| Coherencia de dependencias tras migración MIT | El verificador confirmó las 21 dependencias directas, sus versiones instaladas/lock y compatibilidad; Angular 21.2.25, build 21.2.27, CDK 21.2.14, PrimeNG 21.1.10, temas 2.0.3, TypeScript 5.9.3 y Vitest 4.1.12 |
| Auditoría de dependencias | No disponible: primer intento agotado a los 120 s; `timeout 300s npm audit --json`, autorizado expresamente, terminó con código 124 a los 5 minutos sin salida. Sin reintento ni afirmación de limpieza |
| Instalación de dependencias | La instalación original agotó 120 s. La migración MIT autorizada terminó correctamente en 21 s con `npm install --no-audit --no-fund` bajo límite de 300 s. `npm ls --all` terminó con código 0. No se ejecutó después un `npm ci` nuevo |
| Evaluación de revisión nativa | No evaluable: el proveedor solicitó declarar los archivos originales restantes sin seguimiento. No se inició una revisión ni se afirmó aprobación o reconocimiento |

Hubo advertencias no fatales de metadatos Maven con respuesta 401, agente dinámico Mockito y API obsoletas. Testcontainers utilizó bases desechables; no se cambió la base existente del proyecto. La base de desarrollo del MVP usa el servicio separado `museum-db` y el puerto 55432. Los archivos locales de entorno no se modificaron.

## Recorridos iniciales en navegador

Se usó Chrome for Testing 156 oficial, descargado con autorización humana en `.browser/`, excluido de Git, y la sesión nombrada `museum-01a16167` de agent-browser.

1. **CSV con errores:** `examples/records-with-errors.csv`, ambos perfiles iniciales publicados y contextos predeterminados. El worker generó 29 errores y una advertencia por columna desconocida. Se conservaron el origen de cada perfil y las filas: `scientificName` vacío en fila 3, `eventDate` inválido en fila 2 y coordenadas fuera de rango en filas 2/3.
2. **Descargas:** los botones JSON y CSV guardaron archivos reales. Ambos contenían 30 incidencias con campo, fila original, descripción, severidad, perfil y versión.
3. **Análisis local:** el registro HAR durante lectura y validación del CSV contiene únicamente dos GET del módulo worker, sin POST ni cuerpo de solicitud. Es evidencia de ese recorrido observado, no una garantía automática sobre cambios futuros.
4. **XLSX:** `examples/records.xlsx` mostró ambas hojas. La hoja `Complete`, elegida mediante teclado, produjo cero incidencias con ambos perfiles. `With errors` produjo el diagnóstico de registros inválidos equivalente al CSV. Los nombres pertenecen a datos de ejemplo y se conservaron.
5. **Perfiles configurables:** se creó mediante la interfaz `Browser acceptance profile` 1.0 con una regla condicional sobre `catalogNumber`; se publicó con confirmación, se duplicó como 1.1 y se editó el borrador. El GET público confirmó que 1.0 seguía publicado con revisión 1 y descripción original; 1.1 era borrador con revisión 1 y nueva descripción. Las reglas eran independientes y equivalentes.
6. **Catálogo:** se comprobaron nombre, URI canónica, definición oficial, categoría y estados vigente/obsoleto.
7. No se observaron errores de navegador en los recorridos CSV/XLSX inspeccionados. Inicialmente se veía un aviso del proveedor por la licencia; no se ocultó ni desactivó, sino que posteriormente se migró a dependencias MIT.

## Fallos registrados y limitaciones

- La prueba de la interfaz principal entregada inicialmente no activaba el contenido diferido. Se reprodujo el fallo y se corrigió su sincronización usando metadatos Query precargados y el estado diferido explícito de Angular. Se conservaron todas las aserciones.
- Una espera de XLSX sin incidencias agotó 30 s porque `select` de agent-browser cambió el valor DOM sin actualizar el campo Angular: `dom=Complete`, `model=With errors`. La selección real con teclado actualizó el modelo y el recorrido corregido aprobó. No se modificó la aplicación para ocultar una deficiencia de automatización.
- Un intento de descarga con un selector textual no admitido por la herramienta no encontró el elemento. La descarga mediante la referencia actual del botón sí guardó el archivo. No fue un fallo de exportación de la aplicación.
- PrimeNG 22 exigía clave y mostraba `Invalid PrimeUI License`. El usuario autorizó migrar. Los archivos de licencia reales de PrimeNG 21.1.10 comunitario y temas 2.0.3 otorgan MIT; se verificaron independientemente las licencias, dependencias y lock. No se inyectaron claves ni se alteró código del proveedor.
- Los formularios basados en señales de Angular 21 son experimentales. Su API compatible conserva el bloqueo de perfiles publicados.
- XLSX se descomprime antes de comprobar los límites de filas/columnas; 10 MiB de archivo comprimido no garantizan un límite equivalente de memoria.
- Keycloak, importación y validación de registros biológicos en backend, y extensión GGBN no están implementados; el MVP debe usarse exclusivamente en localhost.
- La auditoría no produjo resultados dentro de los dos límites descritos. El usuario aceptó esta evidencia no disponible; no se declaró que existieran o no vulnerabilidades.

## Conservación del comportamiento al migrar a MIT

El conjunto compatible está fijado en `package.json` y su lockfile. Query 5.104.5 y `read-excel-file` 9.3.12 no cambiaron. La única adaptación de producción cambió la sintaxis de la función `disabled` de Angular; el predicado de bloqueo y la protección al guardar permanecieron iguales.

Se reprodujo el fallo de metadatos sin resolver de Angular 21 y se agregó `await TestBed.compileComponents()` sin quitar aserciones. El padre y el verificador aprobaron 49/49 pruebas; la compilación de producción fue correcta. El verificador también comprobó el estado deshabilitado en perfiles publicados y habilitado en duplicados, borradores y perfiles nuevos.

En navegador, después de migrar:

- El CSV generó los mismos 30 objetos JSON, **idénticos en contenido y orden** a la descarga anterior.
- La hoja XLSX `Complete` siguió sin incidencias con ambos perfiles.
- Los metadatos y campos de reglas de publicaciones estaban deshabilitados y no había acción de guardado.
- Captura y DOM confirmaron la ausencia del aviso de licencia, sin modificar código del proveedor.

## Traducción al español: evidencia específica

Alcance elegido por el usuario: **«Interfaz, diagnósticos y documentación — recomendado»**. Se mantienen identificadores técnicos, nombres Darwin Core, URI y contratos de API. Los archivos de origen, citas TDWG y contenido arbitrario de los usuarios no se alteran.

### Backend

- RED observado: el título HTTP esperado `Solicitud incorrecta` era `Bad Request`.
- GREEN focalizado: una prueba pública aprobada comprueba títulos y detalles españoles para errores 400/404/409/405, encabezado `Allow` y el listado completo de perfiles sin modificaciones tras rechazos.
- Suite completa: **21 pruebas aprobadas**, cero fallos/errores/omisiones; paquete ejecutable aprobado.
- La traducción usa el tratamiento de excepciones de Spring y conserva encabezados, estado, instancia y claves técnicas. No se cambió la migración Flyway V1 ni los datos publicados.

### Frontend

- El worker observó cuatro fallos esperados al añadir las aserciones de español y luego **56/56 aprobadas**. Se conservan las pruebas anteriores y se comprueban objetos originales intactos, enumerados, claves JSON y publicación sin cuerpo.
- El padre observó **56/56 aprobadas** y compilación correcta. La localización de mensajes iniciales es solo de presentación, acotada a los perfiles oficiales conocidos por identidad y versión; una duplicación conserva los textos originales como datos.
- Chromium comprobó el asistente completo en español: CSV con 29 errores y una advertencia, descargas JSON/CSV de 30 incidencias, y hoja XLSX válida sin incidencias. Las filas, campos, enumerados y claves JSON coinciden con el diagnóstico anterior; solo se tradujeron los textos y la etiqueta del sistema.
- El HAR del análisis español contiene dos GET del worker, sin POST ni cuerpo de solicitud. El GET de perfiles permaneció idéntico tras consultar y analizar: la localización no reescribió las cuatro versiones previas.
- En la interfaz española se creó `Perfil de comprobación en español` 1.0, se editó su descripción, se publicó con confirmación española y se duplicó como 1.1. El GET público confirmó 1.0 publicado/revisión2, 1.1 borrador/revisión0, reglas y textos españoles conservados, identificadores independientes y cuatro perfiles previos intactos. Los campos publicados estaban deshabilitados y no se observaron errores del navegador.
- Los títulos, navegación, paginación, etiquetas de estado/condición/severidad y ayudas se observaron en español. Los nombres de hojas y datos arbitrarios de usuarios permanecen originales. Las cadenas propias del navegador o de controles internos de terceros pueden depender del idioma del entorno y no se alteró código del proveedor.

### Incidente del servidor de desarrollo

Una solicitud de referencia al servidor local antiguo agotó su límite de 5 segundos y se registró como fallo, sin reintentar. El diagnóstico separado encontró PostgreSQL saludable y el proceso Java antiguo todavía escuchando en 8080, pero con `NoClassDefFoundError` de Logback en su registro. Su JAR había permanecido en ejecución mientras se reconstruía el mismo archivo. No se identificó un fallo de traducción ni de base de datos.

El usuario autorizó explícitamente «Sí, actualizar el proceso y completar la comprobación». Se detuvo únicamente el proceso Java local antiguo y se inició la versión española desde `backend/target/runtime-es/museo-es.jar`, una copia distinta del artefacto reconstruible. No se borraron datos ni se ejecutó otra auditoría. La espera acotada de disponibilidad terminó correctamente con GET200; posteriormente la API real devolvió errores400/409/404/405 en español, conservó `Allow` con GET/POST y dejó intactos los perfiles frente a los rechazos. El recorrido español posterior se completó correctamente.

Al reabrir la automatización, la sesión de Chrome había expirado y su lanzamiento sin ruta explícita no encontró un navegador. Se volvió a indicar la ruta ya autorizada de `.browser/chrome-headless-shell-linux64/chrome-headless-shell`, sin descargar otro navegador ni cambiar la aplicación. Las comprobaciones reales siguientes utilizaron ese ejecutable.

Las capturas, descargas y HAR permanecen en `.browser/`, excluido de Git. Los perfiles de aceptación permanecen visibles en la base aislada; no se eliminó historial publicado como limpieza.
