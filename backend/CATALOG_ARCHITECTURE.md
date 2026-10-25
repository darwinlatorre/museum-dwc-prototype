# Arquitectura del catálogo TDWG

El catálogo conserva su contrato HTTP y su instantánea única en PostgreSQL. El núcleo no depende de Spring, JPA, Jackson, Commons CSV ni HTTP.

## Límites por paquete

| Paquete bajo `co.edu.unicauca.backend.catalog` | Responsabilidad |
| --- | --- |
| `domain.model` | `Term`, candidato completo y estado, sin anotaciones de transporte. |
| `domain.identity`, `domain.policy` | Identidad SHA-256 exacta y política de conservación/diferencias. |
| `application.port.in` | Consultas y sincronización, con resultados `SUCCESS`, `FAILED` y `SUPERSEDED`. |
| `application.port.out` | Fuente de candidatos completos y almacenamiento con operaciones atómicas. |
| `application.service` | Secuencia de intentos, recuperación de errores y resolución de generaciones. |
| `infrastructure.adapter.in.web` | Controller de rutas que delega en `service/CatalogWebService`; DTO en `dto/res` y conversiones en `mapper/CatalogHttpMapper`. |
| `infrastructure.adapter.in.scheduling` | Temporización y diagnóstico; delega al mismo caso de uso que HTTP. |
| `infrastructure.adapter.in.bootstrap` | Entrada de inicialización idempotente del bundle local. |
| `infrastructure.adapter.out.database` | Adaptador transaccional con subpaquetes explícitos `entity`, `repository` y `mapper`. |
| `infrastructure.adapter.out.tdwg` | HTTP acotado, fuentes fijadas a una revisión, Commons CSV y serialización del candidato. |
| `infrastructure.config` | `CatalogBeanConfig`: composición Spring explícita de puertos y adaptadores. |

## Atomicidad y concurrencia

1. `beginAttempt` bloquea la fila única, incrementa la generación y registra el instante dentro de su transacción.
2. La descarga y el análisis de las tres fuentes terminan **fuera de esa transacción**, antes de abrir la activación.
3. `activate` adquiere el bloqueo pesimista, descarta generaciones antiguas y comprueba la identidad del candidato. Si hay cambios, deserializa la instantánea bloqueada y ejecuta `CatalogPolicy.compare` **sin liberar el bloqueo**. Sólo después actualiza payload, revisión, hashes, contadores, versión y fecha.
4. `fail` registra el fallo únicamente si su generación sigue vigente. Un intento antiguo no reemplaza una activación ni un fallo posterior.
5. La sincronización manual compara su generación con el estado final: una operación desplazada devuelve `SUPERSEDED`, aunque su descarga haya sido válida. El disparador programado no necesita consultar el estado final.

Las transacciones están en el adaptador de persistencia, no en el caso de uso. La inicialización conserva los bytes originales de `catalog.json` y `provenance.json`; si ya existe payload, no lee ni reemplaza el bundle. Las actualizaciones idénticas no cambian versión, fecha ni contadores y sí limpian el fallo vigente. Omitir una URI existente rechaza el candidato completo.

## Adaptadores y compatibilidad

- `CatalogSource` sigue siendo el seam de transporte sustituible por las pruebas; pertenece a `infrastructure.adapter.out.tdwg`. `TdwgCatalogSource` combina ese seam con el parser e implementa el puerto de candidatos.
- Se conservan las tres rutas oficiales, revisión SHA fijada, headers CSV, categorías vacías, textos exactos, límites de tamaño/tiempo, UTF-8 estricto y ausencia de redirecciones/reintentos.
- `GET /api/catalog` sirve directamente el JSON persistido. Estado y respuesta manual conservan sus campos públicos; los diagnósticos internos del intento no se serializan en la respuesta HTTP.
- `POST /api/catalog/sync` rechaza cualquier primer byte, independientemente de su tipo de contenido, antes de incrementar intentos.
- El catálogo no importa código productivo de perfiles. Los errores de transporte siguen usando la traducción HTTP compartida existente.

## Mappers, construcción y transporte

`CatalogHttpMapper` convierte estado/resultados a `CatalogStatusResponse`, `CatalogActiveResponse` y `CatalogSyncResponse`. Ningún DTO de salida expone registros de dominio. `CatalogWebService` coordina estas conversiones y comprueba el cuerpo vacío; el servicio de aplicación sigue siendo Java puro y no recibe objetos servlet ni DTO HTTP.

`infrastructure/adapter/out/database/mapper/CatalogPersistenceMapper` convierte JSON y entidades a modelos, y aplica los campos del candidato a la misma entidad administrada, sin sustituir su identidad. No abre transacciones, no decide generaciones ni ejecuta la política: el adaptador `infrastructure/adapter/out/database/CatalogStore` sigue evaluando `CatalogPolicy` con la instantánea bloqueada y pasa la versión resultante al mapper. No es el puerto homónimo `application/port/out/CatalogStore`. `infrastructure/config/CatalogBeanConfig.java` conecta fuente, parser, mapper, almacenamiento y disparadores sin introducir DTO HTTP en `application/service/CatalogUseCase`.

Un mapper transforma representaciones; un builder construye un objeto con campos nombrados. El builder de perfiles está documentado en [arquitectura de perfiles](PROFILE_ARCHITECTURE.md); no se agregan builders redundantes para cada record del catálogo.

No se inventan DTO `req` para operaciones sin cuerpo. El JSON publicado de `/api/catalog` se sirve sin envolver ni reserializar y los errores conservan `ProblemDetail`, conforme a la decisión de compatibilidad.

## Pruebas y verificación

`CatalogPolicyTests` caracteriza conservación, diferencias, deprecación, textos exactos, identidad y copia defensiva del candidato. `CatalogUseCaseTests` usa puertos falsos para comprobar orden de operaciones, errores y las ocho combinaciones de intentos manuales/programados con éxito/fallo.

Las pruebas existentes `CatalogSyncTests` y `TdwgSourceTests` conservan sus aserciones de transporte, bytes, reinicio durable y carreras reales sobre PostgreSQL desechable; sólo cambian los imports de los tipos extraídos. Los falsos del núcleo **no sustituyen** esas integraciones.

La refactorización actual aprobó **171 pruebas backend en 13 clases actuales**, sin fallos, errores ni omisiones, y el paquete. Las ocho focalizadas incluyen `CatalogHttpMapperTests` y los casos de perfiles; son un subconjunto de la suite, no ocho pruebas adicionales. El checker real y sus diez regresiones Python aprobaron. El verificador independiente no encontró bloqueadores: compiló los núcleos con `javac` y ejecutó 65 casos puros más las comprobaciones Python. El diferencial público contra `af5edab` mantuvo **50/50 observaciones idénticas** de estado, cuerpo exacto y encabezados; no equivale por sí solo a repetir todas las carreras. Sin aprobación nativa todavía.

Como evidencia histórica de la aceptación hexagonal, el verificador independiente ejecutó65pruebas del catálogo sin fallos ni omisiones, incluidas las ocho carreras mixtas sobre PostgreSQL y el reinicio durable. El padre incorporó la regresión `CatalogLockedCurrentPolicyTests` y ejecutó66pruebas de catálogo dentro de160totales, más paquete y contrato diferencial. Ver [VERIFICATION.md](../VERIFICATION.md) para evidencia, consentimiento de caché y límites; no se presenta la evidencia histórica como una nueva suite ni como aprobación nativa.
