# API de perfiles de validación del museo

Spring Boot **4.1.1**, Java **21**, Spring Data JPA, PostgreSQL y Flyway. Los archivos biológicos permanecen en el navegador; el backend administra perfiles declarativos y entrega el catálogo.

## Ejecución local

Iniciar la base aislada mediante `compose.mvp.yml`, según el README principal. Desde `backend/`:

```sh
bash ./mvnw spring-boot:run
```

Si se inicia manualmente con `java -jar`, usar una copia de ejecución distinta de `target/backend-0.0.1-SNAPSHOT.jar`. No reconstruir ni sobrescribir un JAR mientras otro proceso lo utiliza: su cargador de clases puede fallar al atender solicitudes. La aceptación actual usa una copia en `target/runtime-evolution/museo-evolution.jar`; detener el proceso antes de reemplazar esa copia. Las compilaciones normales pueden regenerar el JAR principal sin sobrescribir el que está en uso.

La API escucha en **127.0.0.1:8080**. La conexión predeterminada es `jdbc:postgresql://127.0.0.1:55432/museum`, usuario `museum` y contraseña exclusiva de desarrollo `museum-local-only`. Se puede configurar mediante `DB_URL`, `DB_USER` y `DB_PASSWORD`. No se cargan archivos dotenv. No apuntar pruebas ni migraciones de desarrollo a una base institucional existente.

Flyway crea el esquema antes de cargar `src/main/resources/data/profiles.json`. Cada identificador inicial se inserta una sola vez; reiniciar nunca sobrescribe versiones guardadas. La carga completa es transaccional. El catálogo usa una instantánea persistida independiente de los perfiles. Solo cuando está vacía se carga el recurso confiable `data/catalog.json` y su procedencia; los reinicios sirven la última instantánea sin depender de la red ni reemplazarla por la semilla.

## Perfil combinado inicial

La carga inicial contiene tres perfiles publicados: **Museo 1.0**, **SiB Registros Biológicos 4.1** y **Museo + SiB 1.0**. Los dos originales conservan exactamente sus identificadores, orden en la semilla, reglas, mensajes y fuentes. El nuevo perfil es una composición local independiente, publicada con revisión **0** e identificador UUID5 `7af9b4b3-e599-53a9-aee7-a55127d74f7f`; no sustituye las versiones anteriores ni certifica publicación oficial SiB.

Sus **56 reglas** son la unión de las 22 del Museo y las 36 de SiB: solo se deduplican dos predicados idénticos (`country` y `scientificName`, obligatorios siempre). La identidad incluye `(field, kind, severity, condition)`, no solo el campo. Se conservan los 22 campos incondicionales del Museo y los ocho de SiB (28 campos distintos), las condiciones, `permitAndCollection`, las advertencias `requiredColumn` de `disposition` y la advertencia de `individualCount`. Cada fuente mantiene la cita original e identifica el perfil y versión aportantes; las dos coincidencias reúnen ambas procedencias. Los mensajes nuevos son españoles sin traducir los identificadores DwC.

Estos son requisitos locales y SiB, no obligaciones universales de TDWG; TDWG sigue siendo la autoridad del vocabulario. Persisten los límites sobre GGBN, permisos y país desconocido descritos en [las fuentes](../sources/README.md). Arrancar incorpora únicamente el nuevo identificador mediante la carga validada existente; repetir el arranque no modifica ninguna publicación. Las pruebas aisladas comprueban la fila completa vía API y rechazan edición y republicación sin alterar datos ni revisiones.

## Endpoints

Los cuerpos de entrada y salida son JSON. Se conservan las claves técnicas en inglés para no romper el contrato; los mensajes destinados al usuario se presentan en español.

| Método | Ruta | Solicitud | Respuesta correcta |
|---|---|---|---|
| GET | `/api/catalog` | — | 200, `Term[]` |
| GET | `/api/catalog/status` | — | 200, metadatos de la instantánea y del último intento |
| GET | `/api/profiles` | — | 200, `Profile[]` con borradores y publicaciones, ordenados por nombre/versión/id |
| POST | `/api/profiles` | `{name,version,description,rules}` | 201, borrador nuevo, revisión 0 |
| PUT | `/api/profiles/{id}` | `{name,version,description,rules,revision}` | 200, borrador actualizado, revisión +1 |
| POST | `/api/profiles/{id}/duplicate` | `{name,version}` | 201, borrador independiente con reglas copiadas, revisión 0 |
| POST | `/api/profiles/{id}/publish` | cuerpo completamente vacío | 200, perfil publicado, revisión +1 |

`Term`: `{name,uri,definition,category,status}`.

`Profile`: `{id,name,version,status,revision,description,rules}`. Los identificadores son UUID generados por el servidor. Los estados del contrato siguen siendo `DRAFT` y `PUBLISHED`, aunque la interfaz muestre «Borrador» y «Publicado». Nombre y versión se recortan en sus extremos y deben formar una combinación única, sensible a mayúsculas, incluso en borradores. Las versiones son etiquetas explícitas; no se incrementan automáticamente como versiones semánticas.

No hay endpoint de eliminación: el historial publicado es permanente y los borradores siguen disponibles para edición.

### Reglas declarativas

`Rule`: `{field,kind,severity,condition,message,source}`.

| Clave | Valores del contrato | Significado |
|---|---|---|
| `kind` | `required`, `requiredColumn`, `date`, `latitude`, `longitude` | Columna y valor obligatorios; solo columna; fecha; latitud; longitud |
| `severity` | `ERROR`, `WARNING` | Error o advertencia |
| `condition` | `always`, `collection`, `permit`, `marine`, `permitAndCollection`, `sampling` | Siempre; colección; permiso; marino; permiso y colección; muestreo |

Los enumerados requieren **cadenas JSON exactas**. Los números, booleanos y valores desconocidos se rechazan; no hay conversión de posiciones numéricas a enumerados. `field`, `message` y `source` no pueden estar en blanco. Las condiciones corresponden al contexto elegido en el navegador, no a expresiones ejecutables. `permitAndCollection` exige ambos contextos; `requiredColumn` solo comprueba el encabezado.

Se permite crear perfiles personalizados sin reglas. No hay `eval`, scripts ni campos universalmente obligatorios. En SiB, `county` representa el municipio; no se agregó una obligación inventada sobre `municipality`.

Ejemplo de creación:

```json
{
  "name": "Colección de investigación",
  "version": "1.0",
  "description": "Requisitos independientes de la colección",
  "rules": [{
    "field": "catalogNumber",
    "kind": "required",
    "severity": "ERROR",
    "condition": "collection",
    "message": "Se requiere el número de catálogo de la colección.",
    "source": "Política del museo"
  }]
}
```

### Rechazos y límites

- **400:** entradas inválidas, campos/enumerados desconocidos, reglas nulas, identificadores vacíos o actualización sin revisión. Publicar también rechaza **cualquier cuerpo no vacío**, incluidos `{}`, `null`, espacios, contenido mal formado y bytes inválidos. Solo el cuerpo realmente vacío se admite.
- **404:** identificador o recurso inexistente.
- **409:** nombre/versión duplicados, revisión desactualizada, publicación repetida o intento de editar una versión publicada.
- **405/415:** método o tipo de contenido no admitidos. La traducción conserva el estado HTTP y los encabezados de protocolo de Spring, incluidos `Allow` y `Accept` cuando corresponden.

Las respuestas de problema conservan sus claves técnicas y no exponen SQL ni detalles internos de PostgreSQL. Los rechazos no alteran versiones, reglas ni revisiones.

Límites: nombre 200 caracteres; versión 100; descripción 10 000; hasta 2 000 reglas; campo/mensaje/fuente de cada regla 200/2 000/4 000 caracteres.

## Persistencia y paquetes

La aplicación de arranque permanece en `co.edu.unicauca.backend`. Los paquetes por función son `profile` (modelo, controlador, validación, ciclo de vida, carga inicial, entidad y repositorio), `catalog` (catálogo local), `shared.api` (respuestas de problema) y `shared.exceptions` (excepciones propias). Las excepciones de Spring conservan sus tipos originales. No se introduce un framework de capas adicional.

Los contratos de entrada viven en `profile.dto.req` (`CreateProfileRequest`, `UpdateProfileRequest`, `DuplicateProfileRequest`, `RuleRequest`) y los de salida en `profile.dto.res` (`ProfileResponse`, `RuleResponse`). El controlador convierte las solicitudes validadas al contenido del modelo y las respuestas del servicio a DTO mediante `ProfileMapper`. El servicio no depende de los DTO de transporte: usa `Profile` y `Profile.Content`, también empleados para validar las semillas. Los enumerados compartidos conservan sus valores y lectura JSON estricta.

`ProfileRepository` extiende `JpaRepository<ProfileEntity, String>`. `ProfileMapper` centraliza además la conversión entidad/modelo y la serialización de reglas JSONB; la carga inicial y las escrituras normales utilizan esas mismas conversiones. `ProfileEntity` expone getters JavaBean (`getId`, `getName`, etc.); los controladores nunca exponen entidades administradas. Las transacciones residen en `ProfileService`, incluidas las lecturas de solo consulta. `open-in-view` permanece deshabilitado.

La entidad conserva una fila por versión y las reglas como JSONB atómico, sin relaciones ni consultas adicionales por regla. Hibernate mapea el JSON como texto serializado por el mismo mapper JSON de la API; leer no vuelve a escribir ni normaliza registros históricos. Flyway V1, sus restricciones y su trigger permanecen intactos; V2 agrega exclusivamente la instantánea del catálogo y Hibernate solo valida el esquema.

La carga inicial valida cada perfil y usa una inserción HQL de entidad con `on conflict (id) do nothing`, ejecutada por el repositorio JPA. No usa JDBC ni SQL nativo en producción, no hace `merge` de publicaciones existentes y conserva la idempotencia incluso entre arranques concurrentes. La revisión de cliente no es un campo ORM `@Version`: la exclusión de escritura se obtiene mediante `PESSIMISTIC_WRITE` y la comparación explícita de revisión dentro de la transacción. Las escrituras se vacían antes de responder para que las restricciones de base mantengan sus respuestas 409.

## Sincronización TDWG y última versión válida

La fuente normativa es https://dwc.tdwg.org/terms/. Se descargan únicamente los tres CSV mantenidos por TDWG indicados en [sources/README.md](../sources/README.md), incluidos los términos Dublin Core importados. Primero se consulta la referencia oficial `master` mediante la API de GitHub del repositorio `tdwg/rs.tdwg.org`; los tres archivos se solicitan en `raw.githubusercontent.com` fijados al mismo SHA de commit. No existen URL configurables ni endpoints de actualización manual.

`catalog.sync.enabled` habilita el programador; `delay` vale **86400000 ms** (un día entre ejecuciones) e `initial-delay` **60000 ms**. Pueden sobrescribirse como propiedades Spring. El arranque no espera ninguna descarga. Cada conexión tiene 5 s de conexión, 10 s de espera de lectura y un presupuesto total de lectura de 40 s comprobado entre bloques (una lectura bloqueada puede sumar hasta 10 s). Se limita la referencia a 128 KiB y cada CSV a 4 MiB; no se siguen redirecciones. No hay reintentos inmediatos: el siguiente ciclo vuelve a intentarlo.

Commons CSV **1.14.1** interpreta comas, comillas escapadas y campos multilínea. Antes de activar se exige el conjunto completo, UTF-8 válido, cabeceras compatibles, filas completas, términos únicos, definiciones oficiales no vacías y al menos un término por archivo. `definition` conserva exactamente `rdfs_comment`; `category` conserva exactamente `tdwgutility_organizedInClass`, incluso vacío. `status` proyecta únicamente `term_deprecated`: vacío/`false` → `current`, `true` → `deprecated`; cualquier otro valor rechaza el conjunto. No se infiere categoría desde `rdf_type` ni se inventan definiciones.

**Política conservadora de ausencias:** si falta cualquier URI previamente almacenada, se rechaza todo el candidato. Una ausencia no demuestra obsolescencia. Una eliminación oficial legítima requiere revisar esta política en otra unidad; nunca se marca automáticamente como obsoleto un término ausente.

V2 mantiene una sola fila durable, sin historial ilimitado. Conserva los bytes JSON entregados, los CSV originales de la última activación, sus hashes SHA-256, el commit fijado, versión local, fecha y conteos de altas/modificaciones/deprecaciones explícitas. La procedencia histórica de la semilla se conserva aparte y no se reescribe. `modified` incluye cambios de estado; `deprecated` cuenta las transiciones explícitas, incluidas altas ya obsoletas. Una revisión diferente con los mismos términos puede actualizar la procedencia con conteos cero; repetir exactamente fuentes y commit no cambia la instantánea ni su fecha/conteos.

Las descargas y el análisis ocurren fuera de la transacción. Un contador de intentos y bloqueo pesimista serializan la activación: solo el intento iniciado más recientemente puede activar o registrar su fallo. Un intento antiguo no puede reemplazar otro posterior, aunque termine después; si el posterior falla, se conserva la última instantánea válida. La activación completa y sus metadatos se confirman juntos. Los fallos de red, HTTP, CSV, conjunto parcial o validación conservan payload, hashes, revisión, fecha y conteos exitosos, también tras reiniciar. Solo cambian los datos separados del intento/fallo.

`GET /api/catalog/status` devuelve `active` (revisión, hash combinado de fuentes, versión local, fecha, conteos y hashes por ruta), `attempts`, `lastAttempt` y `lastFailure`. No modifica datos. `GET /api/catalog` conserva sus cinco claves y devuelve directamente el JSON persistido mediante una lectura transaccional, con OSIV deshabilitado.

## Versiones publicadas y concurrencia

El controlador delega las operaciones en un único servicio transaccional. Los bloqueos de fila PostgreSQL serializan la edición y publicación de una versión. La edición compara la revisión enviada por el cliente y evita sobrescrituras desactualizadas. Publicar toma el último borrador bloqueado y no acepta una revisión en el cuerpo: ese contrato exige cuerpo vacío. Dos publicaciones simultáneas tienen un único resultado ganador. La restricción única de la base resuelve las creaciones concurrentes de un mismo nombre y versión.

Las reglas JSONB pertenecen a la misma fila; no existen reglas hijas que puedan cambiar de forma independiente. Un trigger rechaza todo `UPDATE` o `DELETE` de una fila previamente publicada, incluidos estado, revisión, metadatos y reglas. Para cambiarla se debe duplicar en otra versión.

Los propietarios y superusuarios de PostgreSQL pueden desactivar triggers. Antes de producción, separar el rol de migración y el usuario de ejecución con permisos restringidos.

La traducción no reescribe perfiles históricos ni cambia la migración V1 ya aplicada: se conserva su checksum de Flyway. Los nombres de campos, estados y reglas siguen siendo identificadores de contrato; sus etiquetas visibles pueden traducirse sin cambiar esos valores.

## Pruebas y paquete ejecutable

Se requiere Java 21 y acceso a Docker. Desde `backend/`:

```sh
bash ./mvnw test
bash ./mvnw package -DskipTests
```

Las pruebas crean un contenedor **PostgreSQL 17 Alpine** desechable en un puerto aleatorio y sustituyen las propiedades de conexión. No usan la base de desarrollo ni omiten pruebas silenciosamente cuando falta Docker. Cubren el ciclo completo mediante MockMvc, datos iniciales, catálogo, entradas inválidas, rechazos sin modificaciones, edición/creación/publicación simultáneas e inmutabilidad ante SQL directo.

Las pruebas de perfiles viven en `src/test/java/co/edu/unicauca/backend/profile/`: `ProfileIntegrationTests` conserva las 26 regresiones previas y `ProfileContractTests` añade una secuencia pública de contrato. Se conservan las comprobaciones de registros publicados históricos, cargas iniciales sucesivas y concurrentes, revisión desactualizada tras una edición válida y carrera entre edición y publicación sin pérdida de contenido. Las sondas de persistencia usan JPA `EntityManager`, sin `JdbcTemplate` ni conexiones JDBC directas. El SQL nativo queda limitado a demostrar los límites reales de PostgreSQL: fila histórica, hashes completos, tipo JSONB y trigger. Cada sentencia rechazada se ejecuta en su propia transacción y revierte antes de comprobar el estado mediante una lectura nueva.

La verificación de este refinamiento ejecutó 52 pruebas backend sin fallos. En copias aisladas de la base `1522b1ff4d2418b43f4905c4434e6112d01f407c` y del candidato, la misma secuencia MockMvc produjo 50 observaciones idénticas de estado, cuerpo exacto y encabezados: creación, edición, duplicación, publicación, catálogo, metadatos y errores. Los 41 rechazos preservaron el listado completo, incluidas reglas y revisiones. Solo se normalizaron los UUID generados y el orden de métodos de `Allow`; un reloj fijo hizo determinista la fecha inicial del catálogo. Las pruebas versionadas no leen el historial Git. Las regresiones de idioma mantienen mensajes en español y encabezados de protocolo. Testcontainers elimina sus contenedores al terminar la JVM.

Las pruebas adicionales del catálogo usan transporte y reloj falsos, PostgreSQL aislado y reinicios de contexto reales. Cubren categorías vacías, definición multilínea y comillas, altas/cambios/deprecación, rechazos sin alterar el estado activo, idempotencia, concurrencia, límites HTTP y el programador automático mientras una descarga está bloqueada. No consultan Internet. La regresión con los tres CSV oficiales completos comprueba los 414 términos y las 52 categorías vacías mediante el GET público, la procedencia ante una revisión nueva sin cambios y las guardas contra activaciones o fallos antiguos. El generador offline conserva ambos perfiles publicados byte a byte; la corrección inicial solo vacía 52 categorías que antes usaban un fallback RDF.

## Seguridad e integraciones futuras

Es un **MVP local sin autenticación**, no un servicio para Internet. No se habilita CORS permisivo: se usa el proxy del frontend. No existen endpoints de carga/importación ni validación de registros biológicos en servidor; multipart está deshabilitado.

Keycloak deberá integrarse en el límite HTTP mediante Spring Security OAuth2 Resource Server: validación JWT de emisor y audiencia, y autorización explícita para consultar, editar y publicar perfiles antes de invocar el servicio. Antes de exponerlo se requieren roles, identidad de auditoría, HTTPS, estrategia CSRF adecuada, límites, control de frecuencia y credenciales de base restringidas. No se instala autenticación simulada ni se confía en cabeceras de identidad aportadas por el cliente.

La importación futura debe usar una operación separada de recepción limitada, aislamiento de contenido y validación autoritativa; los datos biológicos nunca deben agregarse al cuerpo de administración de perfiles como atajo de carga.
