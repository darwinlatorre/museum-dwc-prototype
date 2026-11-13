# Colecciones: importación confirmada y registros recuperables

El módulo `collections` implementa la persistencia de [collections-management.md](../odd/tasks/collections-management.md): **S2, S5 y S7–S10**. Guarda colecciones reutilizables y registros en PostgreSQL, nunca archivos CSV/XLSX. El análisis y la normalización siguen siendo locales; solamente la confirmación explícita envía los valores originales y de trabajo. La interfaz consume este contrato desde Finalizar y Colecciones; su recorrido y guardas se describen en [frontend/README.md](../frontend/README.md#colecciones-persistidas). La evidencia de T2 al final de este documento corresponde al corte backend, no a una nueva suite integral.

> **Privacidad (risk item 1):** esta funcionalidad cambia el alcance histórico de «registros solo en navegador». Las filas confirmadas, sus originales, cabeceras y asignaciones sí quedan en la base. No se reciben nombres de archivos ni binarios. No hay autenticación, cifrado añadido ni autorización por usuario: conservar exclusivamente localhost y no exponer este MVP a Internet. Los README y AGENTS distinguen esta persistencia explícita del análisis local; la evidencia y sus límites se conservan en [VERIFICATION.md](../VERIFICATION.md).

## Recorrido recomendado

1. Leer `GET /api/validation-configuration` y `GET /api/catalog/status`; conservar `revision` y `active.snapshotVersion` del análisis.
2. Elegir una colección existente por UUID o proporcionar nombre/contexto para una nueva. El nombre es presentación, no una clave única; no se traduce ni recorta.
3. Confirmar advertencias y enviar `POST /api/collections/imports` con una clave UUID estable por confirmación. No generar otra clave al reintentar una respuesta perdida.
4. Ante 409 por revisión/configuración/catálogo, refrescar y volver a analizar/confirmar con una clave nueva. Ante 422, mostrar las incidencias y no afirmar que se importó parcialmente.
5. Leer colecciones y registros paginados. Cada mutación utiliza la revisión de la colección y devuelve su nueva revisión. No hay eliminación de colecciones ni borrado definitivo de registros.

## Contrato HTTP

JSON UTF-8; los cuerpos descritos son objetos completos: **todas las propiedades mostradas son obligatorias**, incluso las que usan `null`. Se rechazan propiedades desconocidas, números/booleanos como textos, fracciones o cadenas como revisiones, contextos desconocidos y estructuras parciales. Los UUID deben usar la forma canónica de 36 caracteres; se permiten letras hexadecimales mayúsculas. El orden de propiedades JSON no forma parte de la identidad de una solicitud.

### Lecturas

| Método/ruta | Resultado 200 |
|---|---|
| `GET /api/collections?page=0&size=50` | Página de `CollectionInfo` |
| `GET /api/collections/{id}` | `CollectionInfo` |
| `GET /api/collections/{id}/records?page=0&size=50&trash=ACTIVE` | Página de `Record` |
| `GET /api/collections/{id}/records/{recordId}` | `Record`, incluso si está en papelera |

- Página: `{ "items": [], "page": 0, "size": 50, "totalElements": 0 }`.
- `page >= 0`, `1 <= size <= 200`, desplazamiento máximo `2147483647`. Orden estable ascendente por UUID, no por el contenido del usuario ni por orden de llegada. Una página fuera de rango está vacía.
- `trash` admite exactamente `ACTIVE` (default), `TRASHED` o `ALL`. Las cuentas siempre son de la colección completa, no de la página.
- Cada consulta de página/detalle mantiene una instantánea `REPEATABLE_READ` para contenido/cuentas. Dos peticiones diferentes pueden observar revisiones diferentes; la guarda de escritura detecta ese caso.

`CollectionInfo`:

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "name": "Colección de referencia",
  "context": "collection",
  "revision": 1,
  "activeCount": 1,
  "trashCount": 0
}
```

`Record`:

```json
{
  "id": "22222222-2222-4222-8222-222222222222",
  "collectionId": "11111111-1111-4111-8111-111111111111",
  "headers": [" ID original ", "locality"],
  "mapping": {" ID original ": "occurrenceID"},
  "sourceRow": 2,
  "originalValues": [" 0001 ", " A "],
  "values": ["0001", " A "],
  "importKey": "33333333-3333-4333-8333-333333333333",
  "configurationRevision": 0,
  "catalogVersion": 0,
  "trashed": false
}
```

Los arrays mantienen el orden de las cabeceras fuente; no son diccionarios de valores convertidos. `configurationRevision`/`catalogVersion` registran la última validación aceptada de ese registro. `importKey` es `null` para altas manuales. `sourceRow` es un entero positivo de procedencia proporcionado por el cliente (fila de origen), no el ID persistido. Originales/procedencia son afirmaciones del cliente, no una certificación del archivo: el servidor no lo recibe ni puede contrastarlo.

### Importar en colección nueva o existente

`POST /api/collections/imports` → **201**, incluso al reproducir una confirmación ya confirmada:

```json
{
  "collectionId": null,
  "name": "Colección de referencia",
  "context": "collection",
  "expectedRevision": null,
  "configurationRevision": 0,
  "catalogVersion": 0,
  "idempotencyKey": "33333333-3333-4333-8333-333333333333",
  "warningsConfirmed": true,
  "headers": [" ID original ", "locality"],
  "mapping": {" ID original ": "occurrenceID"},
  "rows": [
    {"sourceRow": 2, "originalValues": [" 0001 ", " A "], "values": ["0001", " A "]}
  ]
}
```

Este ejemplo ilustra la forma; no satisface necesariamente los campos obligatorios de la configuración vigente.

- **Nueva:** `collectionId`/`expectedRevision` son `null`; `name` no vacío/en blanco, máximo 200 caracteres. La primera importación deja revisión 1.
- **Existente:** `collectionId` es el UUID, `expectedRevision` su revisión y `name: null`. `context` debe coincidir literalmente con el de la colección; una importación no cambia nombre/contexto.
- Contextos exactos: `collection`, `permit`, `sampling`, `marine`, `other`.
- Respuesta: `{ "idempotencyKey": "…", "collectionId": "…", "revision": 1, "inserted": 1 }`. No devuelve hashes ni filas como parte del recibo.
- Cada importación exitosa incrementa una sola vez la revisión, independientemente de su cantidad de filas. El recibo sigue refiriéndose a esa revisión histórica aunque haya ediciones posteriores.
- Una clave ya confirmada + misma identidad devuelve el mismo recibo, sin insertar ni incrementar revisión. Esto ocurre **antes** de exigir vigencia de revisiones: reproducir trabajo ya confirmado no lo reejecuta.
- La identidad incluye destino, nombre, contexto, revisiones, consentimiento, cabeceras, asignaciones, filas/originales/valores y su orden. Se serializa con longitudes explícitas y asignaciones ordenadas por clave, y se identifica mediante SHA-256. Cambiar cualquier componente bajo la misma clave produce 409 `IDEMPOTENCY_CONFLICT`. Una solicitud rechazada no reserva la clave.

### Agregar, editar y papelera

| Método/ruta | Cuerpo | Resultado |
|---|---|---|
| `POST /api/collections/{id}/records` | Alta descrita abajo | 201 `CollectionInfo` |
| `PUT /api/collections/{id}/records/{recordId}` | Edición descrita abajo | 200 `CollectionInfo` |
| `POST /api/collections/{id}/records/{recordId}/trash` | `{"expectedRevision": 1}` | 200 `CollectionInfo` |
| `POST /api/collections/{id}/records/{recordId}/restore` | Restauración descrita abajo | 200 `CollectionInfo` |

Alta:

```json
{
  "expectedRevision": 1,
  "configurationRevision": 0,
  "catalogVersion": 0,
  "warningsConfirmed": true,
  "headers": ["occurrenceID", "locality"],
  "mapping": {},
  "row": {"sourceRow": 1, "originalValues": ["0002", " A "], "values": ["0002", " A "]}
}
```

Edición:

```json
{
  "expectedRevision": 2,
  "configurationRevision": 0,
  "catalogVersion": 0,
  "warningsConfirmed": true,
  "values": ["0002", " B "]
}
```

Restauración:

```json
{
  "expectedRevision": 4,
  "configurationRevision": 0,
  "catalogVersion": 0,
  "warningsConfirmed": true
}
```

- La edición modifica solo `values`, alineados con las cabeceras persistidas; no permite reescribir originales, cabeceras, asignaciones, fila de origen, colección ni clave de importación. Cada alta puede conservar su propio esquema fuente; la colección no impone un único esquema de columnas.
- Altas/ediciones/restauraciones revalidan contra configuración y catálogo actuales; no confían en diagnósticos enviados por el navegador. No revalidan ni reescriben retroactivamente las otras filas almacenadas.
- Retirar no necesita consentimiento ni nuevas revisiones de configuración/catálogo; solo la revisión actual de colección. Retirar algo ya retirado y restaurar algo activo producen conflicto; ninguna operación es un toggle implícito.
- La papelera no participa en los índices activos de duplicados. Por eso puede ingresarse un reemplazo mientras el original está retirado, pero restaurar el original colisionará hasta retirar/cambiar el reemplazo.
- Cada éxito incrementa la revisión una vez. Alta manual no tiene clave idempotente: ante pérdida de respuesta, refrescar la colección antes de repetir; una repetición con revisión obsoleta nunca duplica silenciosamente. Para obtener los UUID después de un alta, refrescar la lista de registros (el alta responde información de colección, no el registro).

## Validación literal y límites

`domain/validation/CollectionValidator` es Java puro y público. Su referencia de paridad son `validator.ts`, `normalization-dates.ts`, `required-fields.ts`, `normalization-rules.ts` (`effectiveField`) y `normalization-duplicates.ts` del importador. **No ejecuta normalización automática**, ni siquiera al recibir valores originales distintos de los de trabajo.

| Regla | Semántica |
|---|---|
| Campo efectivo | Asignación propia textual no vacía, o cabecera literal; sin trim/cambio de case |
| Obligatoriedad | Solo `requiredFields` del contexto vigente; columna ausente o celda vacía según whitespace ECMAScript produce error; `optionalFields` no exige presencia |
| TDWG | Nombre exacto en la instantánea vigente; columna desconocida produce advertencia y hasta 3 sugerencias con el mismo algoritmo/orden frontend. No se añaden políticas nuevas por estado del término |
| `eventDate` | Formas ISO comunes de precisión año/mes/día, hora opcional, fracción/zona y hasta un `/` de intervalo; calendario real, año 1–9999, zona máxima ±14:00. Sin coerción de fecha ni zona |
| Coordenadas | Literal decimal/exponente con signo opcional; número finito dentro de ±90/±180. Vacío no dispara integridad básica; espacios alrededor de números no se normalizan |
| Componentes | `year`/`month`/`day` enteros literales de 1–9999/12/31; calendario y consistencia con componentes presentes de un `eventDate` simple. La conversión usada para comparar replica `Number(string)` sin cambiar el valor almacenado |
| Duplicados | En persistencia son bloqueos, no los avisos no destructivos del análisis local. Igualdad completa de pares campo efectivo→valor literal, independiente del orden fuente, o mismo `occurrenceID` literal si no está en blanco. No se recortan IDs ni se colapsa su case/ceros |

Las columnas efectivas deben ser únicas. Dos esquemas con distinto conjunto de campos no son la misma fila completa (una columna ausente no se equipara a una celda vacía). Los duplicados se buscan dentro del lote y contra **solo registros activos de la misma colección**. Otras colecciones son independientes. Los errores bloquean todo el lote; advertencias requieren `warningsConfirmed: true`. Un consentimiento no vence errores ni duplicados.

Límites acumulativos:

- Cuerpo bruto máximo **32 MiB**, limitado antes de deserializar, también sin `Content-Length`.
- De 1 a **50.000 filas** y de 1 a **500 columnas** por importación; ambas listas de valores deben tener exactamente la cantidad de cabeceras. `sourceRow` único dentro de ese lote y entre 1 y 2147483647.
- Hasta 500 asignaciones, exclusivamente para cabeceras existentes; cabeceras/destinos máximo 2.000 unidades UTF-16, celdas máximo 100.000. Cabeceras fuente sin duplicados.
- Hasta **20 Mi unidades UTF-16** sumando cabeceras, originales y valores de trabajo por validación; no es un límite de filas totales de una colección. El límite bruto puede alcanzarse antes por codificación/escape JSON.
- Máximo **100.000 incidencias**. Se rechazan NUL y sustitutos UTF-16 incompletos, que PostgreSQL UTF-8 no puede conservar. No se rechaza arbitrariamente texto restante ni se modifican espacios/case/ceros.
- Revisiones/versiones son enteros JSON no negativos representables como `long`; no hay opción de omitir las guardas.

## Errores públicos

Se usa `application/problem+json`: `status`, `title`, `detail`, `instance`. Los errores de negocio agregan `code` e `issues` (vacío si no hay incidencias). Una incidencia contiene exclusivamente `{field,row,severity,context,configurationRevision,description}`; no contiene el valor de la celda. `row: null` indica columna/campo, no una fila almacenada. Descripciones de validación conservan el español exacto del frontend.

| Estado / título | Código | `detail` exacto |
|---|---|---|
| 400 / Solicitud incorrecta | `INVALID_REQUEST` | El contenido de la solicitud no es válido. |
| 400 / Solicitud incorrecta | `INVALID_MAPPING` | Dos columnas de origen no pueden asignarse al mismo campo. |
| 400 / Solicitud incorrecta | `INVALID_PAGING` | La paginación no es válida. |
| 400 / Solicitud incorrecta | `TOO_MANY_ISSUES` | Se superó el límite de incidencias (100.000). Seleccione un archivo más pequeño. |
| 404 / No encontrado | `NOT_FOUND` | No se encontró el recurso solicitado. |
| 409 / Conflicto | `CONFIGURATION_CHANGED` | La configuración de validación cambió; vuelva a analizar los datos. |
| 409 / Conflicto | `CATALOG_CHANGED` | El catálogo TDWG cambió; vuelva a analizar los datos. |
| 409 / Conflicto | `REVISION_CONFLICT` | La revisión de la colección cambió; actualice los datos antes de guardar. |
| 409 / Conflicto | `CONTEXT_CONFLICT` | El contexto no coincide con el de la colección. |
| 409 / Conflicto | `IDEMPOTENCY_CONFLICT` | La clave de importación ya se utilizó con otra solicitud. |
| 409 / Conflicto | `DUPLICATE` | La operación contiene registros duplicados dentro de esta colección. |
| 409 / Conflicto | `RECORD_TRASHED` | El registro está en la papelera. |
| 409 / Conflicto | `RECORD_ACTIVE` | El registro ya está activo. |
| 413 / Solicitud demasiado grande | `PAYLOAD_TOO_LARGE` | La solicitud supera el tamaño permitido. |
| 422 / Validación pendiente | `VALIDATION_FAILED` | Los errores de validación impiden guardar los registros. |
| 422 / Validación pendiente | `WARNINGS_UNCONFIRMED` | Confirme las advertencias antes de guardar los registros. |
| 503 / Servicio no disponible | `AUTHORITY_UNAVAILABLE` | La configuración o el catálogo no están disponibles. Actualice los datos. |

Errores de JSON/tipos/Bean Validation y errores MVC de parámetros mantienen el manejador compartido existente: 400 genérico sin prometer `code`/`issues`. Métodos no soportados, media types y negociación conservan 405/415/406. Los conflictos de restricciones inesperados mantienen el 409 compartido sanitizado, sin SQL. El filtro 413 actúa antes de MVC y no agrega por su cuenta permisos CORS; no se amplía la política restrictiva existente.

Un rechazo deja listas, detalle, cuentas, revisiones y recibos sin efectos. No se registra contenido biológico ni cuerpos de solicitudes en el código nuevo. No habilitar logs de parámetros SQL/cuerpos al usar datos reales.

## Fronteras y transacción (risk item 4)

`CollectionController` → `CollectionOperations` decorado → `CollectionService` puro → puertos `CollectionStore` / `ValidationAuthority`.

- Núcleo `domain`/`application` sin Spring, JPA, Jackson ni DTO HTTP. Lombok solo genera constructores/builders permitidos. HTTP y persistencia tienen mappers MapStruct separados, bajo `BackendMapperConfig`, instanciados explícitamente en `CollectionBeanConfig`.
- El adaptador `JpaValidationAuthority` posee proyecciones **JPA inmutables de solo lectura** sobre `validation_configuration` y `catalog_snapshot`. No importa tipos productivos de las funcionalidades propietarias, no replica bootstrap, normalización, edición o activación y nunca escribe esas tablas. Su contrato consumidor está en `collections/application/port/out`. El acoplamiento deliberado a sus esquemas durables queda exclusivamente en este adaptador.
- Orden de bloqueo: configuración `PESSIMISTIC_WRITE` → catálogo `PESSIMISTIC_READ` → colección `PESSIMISTIC_WRITE`, mantenidos hasta commit/rollback. Las escrituras de sus propietarios compiten con los mismos bloqueos físicos. Una instantánea ausente bloquea la escritura, no se inventan defaults.
- `TransactionalCollectionOperations` es el único bean del puerto de entrada. La transacción abarca lectura de autoridad, recibo/revisión, validación, detección de duplicados, creación/actualización, `flush` y recibo. Los accesos de repositorio no abren transacciones independientes para soltar las guardas entre pasos.
- La fila global de configuración serializa **todas** las mutaciones de colecciones: resuelve también carreras de claves idempotentes antes de existir una colección/recibo. Es una decisión técnica conservadora del MVP, no una afirmación de escalabilidad entre colecciones. No se mantienen locks solo en memoria.
- Importaciones insertan entidades mediante JPA y un `flush` del lote, no `flush` de todas las entidades administradas por cada fila. No hay SQL productivo de inserción fuera de JPA ni dependencias nuevas. No se ha medido el rendimiento de 50.000 filas.
- Hashes SHA-256 de filas canónicas e IDs literales permiten índices únicos activos acotados, sin indexar textos arbitrarios largos. Un choque criptográfico hipotético se trata conservadoramente como conflicto, nunca como permiso para insertar un duplicado. La revisión es explícita de colección, no un contador de cliente ni un `@Version` de registro.

### Migración aditiva

`V5__collections.sql` crea únicamente `biological_collection`, `collection_record`, `collection_import`, índices y la función/trigger propios `preserve_collection_record_origin()` / `immutable_collection_record_origin`. V1–V4 no cambian. No elimina, reescribe ni migra datos de catálogo/configuración/Flyway; no se ejecutó contra bases vivas.

Cada registro es una fila con arrays JSONB textuales y procedencia, no un archivo serializado en disco. Las restricciones comprueban contexto, longitudes de arrays, revisiones, claves foráneas y unicidad activa. El trigger impide modificar identidad/origen incluso por una actualización JPA incorrecta. El FK diferido del recibo permite escribir filas y recibo dentro de la misma transacción sin persistir primero una confirmación incompleta.

## Evidencia y revisión

Desde `backend/`, los comandos autorizados son:

```sh
bash ./mvnw -Dtest='Collection*Tests' test
python3 scripts/check_architecture.py
python3 scripts/test_architecture.py
```

Pruebas de `CollectionHttpTests` usan PostgreSQL 17 Alpine desechable y MockMvc, sin consultas a bases vivas. Cubren importación nueva/existente, originales/asignaciones literales, duplicados internos/activos y aislamiento por colección, rechazo sin efectos, advertencias, configuración/catálogo/revisiones obsoletos, idempotencia, carreras de confirmaciones/importaciones/ediciones, CRUD/papelera/restauración y paginación. El fallo sintético al guardar el recibo ocurre después del `flush` real de filas/revisión; sus verificaciones públicas comprueban rollback y reutilización posterior de la clave. El spy solo inyecta ese fallo, no sustituye PostgreSQL ni el repositorio real del resto de operaciones.

`CollectionValidatorTests` caracteriza calendario, precisión ISO, intervalos, zonas, coordenadas/exponentes, componentes y conversión numérica, campos obligatorios, sugerencias y asignaciones. Son pruebas deterministas de paridad seleccionada, no una prueba diferencial exhaustiva del motor TypeScript completo. La última ejecución focalizada aprobó **18 pruebas: 14 HTTP/PostgreSQL y 4 del validador**, sin fallos, errores u omisiones. El checker aprobó y sus **16 regresiones** también. No se ejecutó navegador, suite frontend, suite Maven general ni benchmark en T2.

Revisión sugerida: primero puerto/servicio/validador; después V5/adapter/mapper/transacción; finalmente contrato HTTP/pruebas. Se supera la guía orientativa de 400 líneas porque este corte mantiene juntas las invariantes transaccionales, su API y las pruebas reales. Corte de commit propuesto para el padre, sin ejecutar Git terminal: **una unidad T2 backend completa** (núcleo, V5, adaptadores, HTTP, pruebas y contrato). No separar un núcleo `collections` sin sus adaptadores: el checker exige la frontera completa por funcionalidad. Los cortes posteriores T3/T4 son integración de Finalizar y gestión tabular, no cambios incluidos aquí. No presentar T2 como aceptación frontend ni T5 integral.
