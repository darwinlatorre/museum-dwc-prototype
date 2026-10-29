# API de fuentes de registros biológicos del museo

Spring Boot **4.1.1**, Java **21**, Spring Data JPA, PostgreSQL y Flyway. Administra únicamente la configuración global de las fuentes de registros biológicos y el catálogo TDWG. El análisis CSV/XLSX y los registros biológicos permanecen en el navegador. Es un MVP local sin autenticación, no un servicio para Internet.

## Ejecución local

El flujo principal es `./start.sh` desde la raíz; ver [requisitos y almacenamiento](../README.md#ejecución-local). El contenedor ejecuta una copia del JAR compilado, sin montar el artefacto del host. En desarrollo se puede usar `bash ./mvnw spring-boot:run` desde `backend/`, proporcionando explícitamente las variables de conexión. Spring no carga dotenv; no usar `source`/`eval` sobre esos archivos.

La API escucha en **127.0.0.1:8080**, configurable mediante `SERVER_PORT`. La URL predeterminada es `jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME}`; `DB_NAME`, `DB_USER` y `DB_PASSWORD` son obligatorios. `DB_URL` permite un override JDBC. Solo Compose consume el `.env` raíz e inyecta la conexión interna; los puertos publicados siguen limitados a localhost. La salud usa `GET /api/catalog/status` sin Actuator.

**No reconstruir `target/classes` ni sobrescribir un JAR que esté en ejecución.** Compilar una copia aislada del árbol cuando el servidor de desarrollo use ese classpath. Las pruebas usan exclusivamente PostgreSQL desechable y nunca la base viva del MVP.

## Endpoints

| Método | Ruta | Entrada | Resultado |
|---|---|---|---|
| GET | `/api/validation-configuration` | sin cuerpo | 200, configuración global |
| PUT | `/api/validation-configuration` | configuración completa con revisión vigente | 200, configuración guardada con revisión +1 |
| GET | `/api/catalog` | sin cuerpo | 200, `Term[]` |
| GET | `/api/catalog/status` | sin cuerpo | 200, estado de la instantánea/intentos |
| POST | `/api/catalog/sync` | cuerpo completamente vacío | 200, `{outcome,status}` |

No hay rutas activas de perfiles, publicación, duplicación ni carga de archivos. `/api/profiles` y sus antiguas rutas devuelven 404, igual que `/api/upload`.

### Configuración completa

```json
{
  "revision": 0,
  "contexts": [
    {"context": "collection", "requiredFields": [], "optionalFields": []},
    {"context": "permit", "requiredFields": [], "optionalFields": []},
    {"context": "sampling", "requiredFields": [], "optionalFields": []},
    {"context": "marine", "requiredFields": [], "optionalFields": []},
    {"context": "other", "requiredFields": [], "optionalFields": []}
  ]
}
```

Las listas vacías son una configuración explícita válida; el ejemplo no representa los defaults. Se exigen exactamente cinco contextos únicos con las claves textuales mostradas. Cada contexto admite hasta **500 campos combinados** entre `requiredFields` y `optionalFields`, de **200** caracteres como máximo. Ambas listas son disjuntas: un mismo texto exacto no puede aparecer en las dos. No se aceptan campos nulos, en blanco, duplicados ni valores JSON no textuales. Se preserva el texto arbitrario y el orden de campos, **sin recorte implícito**; ` county ` y `county` son valores diferentes. La respuesta ordena los contextos como en el ejemplo.

`optionalFields` contiene campos configurados y visibles, pero no obligatorios; alternar el estado mueve el nombre entre listas, mientras Quitar lo retira de ambas. Las respuestas GET/PUT incluyen siempre ambas listas. Los campos opcionales son metadatos, no generan diagnósticos de obligatoriedad.

| `optionalFields` por contexto | Lectura o PUT |
|---|---|
| Ausente en JSON almacenado o semilla antigua | Se lee como `[]`; GET no reescribe datos ni revisión |
| Ausente en PUT legado | Conserva los opcionales guardados bajo el mismo bloqueo/revisión; elimina de esa lista solo coincidencias exactas promovidas explícitamente a `requiredFields` |
| Lista explícita, incluso `[]` | Reemplaza la lista; `[]` elimina todos los opcionales de ese contexto |
| `null`, forma incorrecta, elementos no textuales/nulos/blancos, duplicados, solapamiento o límites excedidos | 400, sin cambiar configuración ni revisión |

La omisión se interpreta individualmente por contexto. `requiredFields` sigue siendo obligatorio. Para clientes nuevos, enviar ambas listas completas de los cinco contextos, no solo la búsqueda visible. Se conserva el orden y texto exacto de los valores que no se mueven; no se normalizan espacios, mayúsculas ni nombres libres. Una revisión obsoleta válida recibe 409 y nunca borra opcionales.

`revision` debe ser un entero JSON no negativo representable en un `long`; no se convierten cadenas, decimales, booleanos ni valores nulos. No se admiten propiedades desconocidas ni estructuras parciales. Solo se reciben nombres de campos de configuración, nunca archivos, celdas o registros biológicos.

| Rechazo | Contrato |
|---|---|
| 400 | `Solicitud incorrecta` / `El contenido de la configuración de validación no es válido.` |
| 409 | `Conflicto` / `La revisión de la configuración cambió; actualice los datos antes de guardar.` |
| 404 | `No encontrado` / `No se encontró el recurso solicitado.` |
| 405/415/406 | Método, tipo de contenido o formato no admitido; conserva encabezados HTTP de Spring |

Los errores son `application/problem+json` con estado, título, detalle e instancia; no exponen SQL ni excepciones de PostgreSQL. Un rechazo no cambia contenido ni revisión. Dos PUT con la misma revisión producen un único ganador y un 409, sin pérdida silenciosa de cambios.

### Defaults y procedencia

`data/validation-configuration.json` contiene la matriz local de [global-validation.md](../odd/tasks/global-validation.md): **30/22/10/15/8** campos para colección/permiso/muestreo/marino/otros. Colección excluye `disposition`; permiso lo exige e incluye `individualCount`, `organismQuantity` y `organismQuantityType`. Las x del pedido se aplican literalmente: no se heredan advertencias ni condiciones combinadas del antiguo producto de perfiles.

TDWG sigue siendo la única autoridad del vocabulario. Esta obligatoriedad es política local solicitada, no una obligación universal Darwin Core ni certificación SiB. [Fuentes y limitaciones](../sources/README.md) conserva la evidencia oficial sin reescribirla. No se valida GGBN ni cumplimiento legal; nunca se inventa `country` desconocido.

## Persistencia y retiro legado

- **V1/V2 no cambian:** conservan sus checksums en Flyway.
- **V3** agrega `validation_configuration`, una única fila estable (`id=1`) con revisión y contextos JSONB.
- **V4** elimina exclusivamente el trigger `immutable_published_profile`, la tabla `profiles` y la función dedicada `preserve_published_profile()`, sin `CASCADE`. Es el retiro irreversible autorizado de los datos históricos de perfiles; no elimina catálogo, configuración ni historial Flyway.

La semilla se valida e inserta mediante JPA/HQL `on conflict (id) do nothing`. Reiniciar nunca sobrescribe una configuración editada. El bootstrap completo tiene una sola transacción; arranques concurrentes son idempotentes. La lectura usa transacción read-only y OSIV sigue deshabilitado.

`optionalFields` se guarda en el JSONB existente, sin V5 ni modificación de V1–V4, tablas, columnas o semillas. Los defaults heredados siguen siendo obligatorios; su lista opcional inicial es vacía.

PUT ejecuta **lock → revisión → merge legado → validación → saveAndFlush** dentro de una única transacción que envuelve el caso de uso. El bloqueo es `PESSIMISTIC_WRITE`, no una transacción independiente por método de repositorio. La revisión es explícita, no `@Version`. MapStruct actualiza la misma entidad administrada ignorando su identidad.

## Arquitectura y generación Java

[`recordsources`](RECORD_SOURCES_ARCHITECTURE.md) y [`catalog`](CATALOG_ARCHITECTURE.md) son funcionalidades independientes con núcleo `domain`/`application` Java puro, puertos propiedad de aplicación y adaptadores de infraestructura. No hay dependencias productivas cruzadas. `ConfigurationBeanConfig` y `CatalogBeanConfig` componen explícitamente los casos de uso, adaptadores y mappers. HTTP recibe únicamente el puerto decorado transaccionalmente.

`recordsources` es el propietario Java de «Fuentes de registros biológicos», alineado con `features/record-sources` en Angular. El cambio de nombre organiza el código; no introduce CRUD de fuentes ni cambia `/api/validation-configuration`, los cinco valores de contexto, revisión, entidades, tablas, migraciones o semillas. S4 agrega únicamente `optionalFields` al contrato JSON, con compatibilidad de lectura y PUT legados descrita arriba. Los nombres `Configuration*` siguen describiendo los casos de uso de configuración; «Contexto» permanece en el análisis.

Lombok (versión de Spring Boot), MapStruct **1.6.3** y binding **0.2.0** se ejecutan durante compilación y pruebas. Solo `@Builder` y `@RequiredArgsConstructor` source-only están permitidos en el núcleo. Lombok y los procesadores quedan fuera del JAR ejecutable. Los mappers usan `BackendMapperConfig` con destinos no mapeados como error; no son componentes Spring implícitos. Los codecs Jackson llegan a persistencia mediante `@Context`; `@MappingTarget` ignora identidad. Las entidades tienen getters JavaBean, sin `@Data`, igualdad, hash o `toString` automáticos. Los DTO de entrada/salida viven en `dto/req` y `dto/res`; JSON estricto y Bean Validation quedan en adaptadores.

## Sincronización TDWG y última versión válida

El catálogo conserva su contrato: `Term` es `{name,uri,definition,category,status}` y se devuelve sin envoltorio. El origen normativo es https://dwc.tdwg.org/terms/. Se consultan los tres CSV mantenidos por TDWG y fijados al mismo SHA de `tdwg/rs.tdwg.org` tras consultar la referencia oficial `master`. No hay URL configurables ni recepción de archivos.

`catalog.sync.enabled` controla el programador; `delay=86400000` e `initial-delay=60000` ms. El arranque no espera la red. Cada conexión tiene 5 s de conexión, 10 s de espera de lectura y presupuesto total de 40 s entre bloques; una lectura bloqueada puede sumar 10 s. Se limita la referencia a 128 KiB y cada CSV a 4 MiB, sin redirecciones ni reintentos inmediatos.

Commons CSV **1.14.1** conserva comillas, comas y texto multilínea. Se exige conjunto completo, UTF-8 válido, cabeceras compatibles, filas completas, URI únicas, definiciones no vacías y términos en los tres archivos. `definition` conserva `rdfs_comment`; `category` conserva `tdwgutility_organizedInClass`, incluso vacío. `term_deprecated` vacío/`false` produce `current`, `true` produce `deprecated`; otros valores rechazan el conjunto. La ausencia de cualquier URI previa rechaza el candidato completo, sin inferir obsolescencia.

La única fila de V2 conserva JSON público, CSV originales, hashes, SHA, versión local, fecha y conteos; la procedencia original se conserva aparte. Repetir fuentes y commit no reescribe el snapshot. Una revisión diferente con idénticos términos puede actualizar procedencia con conteos cero. Descarga/análisis ocurren fuera de la transacción; inicio, activación y fallo son atómicos. La política se evalúa contra el snapshot bloqueado. Solo el intento más reciente puede activar o registrar su fallo, incluso si uno anterior termina después.

Sincronización manual y programada comparten maquinaria. `outcome` es `SUCCESS`, `FAILED` o `SUPERSEDED`; HTTP 200 no implica éxito de la descarga. Cualquier cuerpo no vacío, incluso espacios, `null` o bytes inválidos, produce 400 sin incrementar intentos. Los fallos conservan la última instantánea válida y sus atributos oficiales, también tras reiniciar. `GET /api/catalog/status` devuelve `active`, `attempts`, `lastAttempt` y `lastFailure` sin mutación.

## Verificación

Desde la raíz, `python3 scripts/test_seeds.py`. Desde una copia aislada de `backend/` con los fixtures `../sources/tdwg/`:

```sh
python3 -B scripts/test_codegen.py
python3 scripts/test_architecture.py
python3 scripts/check_architecture.py
bash ./mvnw clean test
bash ./mvnw package -DskipTests
```

Requieren Docker; Testcontainers usa PostgreSQL 17 Alpine y puertos aleatorios, sin consultar la base viva. Las pruebas JPA/EntityManager cubren matriz, límites JSON, rechazos sin efectos, revisión/concurrencia, bootstrap, rollback, reinicios, instalación limpia y actualización V1/V2 con publicaciones hacia V3/V4 sin efectos colaterales. Las pruebas de catálogo mantienen las carreras y `SUCCESS`/`FAILED`/`SUPERSEDED`, comparando ahora la configuración antes/después.

La evidencia ejecutada y sus limitaciones se registran en [VERIFICATION.md](../VERIFICATION.md); las cifras históricas no son una nueva suite integral. Esto no constituye auditoría de seguridad ni prueba de navegador.

## Límites y futuro

No hay autenticación, importación biológica en servidor ni CORS permisivo. Antes de exponer el servicio se necesitan autorización, identidad de auditoría, HTTPS, límites y roles restringidos de base. La futura autenticación debe proteger el límite HTTP; no se confía en cabeceras aportadas por el cliente. Los datos biológicos no deben agregarse al cuerpo de configuración como atajo de importación.
