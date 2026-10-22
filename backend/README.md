# API de perfiles de validación del museo

Spring Boot **4.1.1**, Java **21**, Spring Data JPA, PostgreSQL y Flyway. Los archivos biológicos permanecen en el navegador; el backend administra perfiles declarativos y entrega el catálogo.

## Ejecución local

Iniciar la base aislada mediante `compose.mvp.yml`, según el README principal. Desde `backend/`:

```sh
bash ./mvnw spring-boot:run
```

Si se inicia manualmente con `java -jar`, usar una copia de ejecución distinta de `target/backend-0.0.1-SNAPSHOT.jar`. No reconstruir ni sobrescribir un JAR mientras otro proceso lo utiliza: su cargador de clases puede fallar al atender solicitudes. El entorno verificado usa una copia en `target/runtime-es/museo-es.jar`; detener el proceso antes de reemplazar esa copia.

La API escucha en **127.0.0.1:8080**. La conexión predeterminada es `jdbc:postgresql://127.0.0.1:55432/museum`, usuario `museum` y contraseña exclusiva de desarrollo `museum-local-only`. Se puede configurar mediante `DB_URL`, `DB_USER` y `DB_PASSWORD`. No se cargan archivos dotenv. No apuntar pruebas ni migraciones de desarrollo a una base institucional existente.

Flyway crea el esquema antes de cargar `src/main/resources/data/profiles.json`. Cada identificador inicial se inserta una sola vez; reiniciar nunca sobrescribe versiones guardadas. La carga completa es transaccional. El recurso `data/catalog.json` se entrega sin modificar su significado ni consultar servicios externos. La ausencia de recursos o un contenido inválido impiden iniciar la aplicación, en lugar de simular un catálogo vacío.

## Endpoints

Los cuerpos de entrada y salida son JSON. Se conservan las claves técnicas en inglés para no romper el contrato; los mensajes destinados al usuario se presentan en español.

| Método | Ruta | Solicitud | Respuesta correcta |
|---|---|---|---|
| GET | `/api/catalog` | — | 200, `Term[]` |
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

La aplicación de arranque permanece en `co.edu.unicauca.backend`. Los paquetes por función son `profile` (controlador, DTO, validación, ciclo de vida, carga inicial, entidad y repositorio), `catalog` (catálogo local) y `shared.api` (respuestas de problema). No se introduce un framework de capas adicional.

`ProfileRepository` extiende `JpaRepository<ProfileEntity, String>`. `ProfileMapper` convierte entre la entidad y los DTO; los controladores nunca exponen entidades administradas. Las transacciones residen en `ProfileService`, incluidas las lecturas de solo consulta. `open-in-view` permanece deshabilitado.

La entidad conserva una fila por versión y las reglas como JSONB atómico, sin relaciones ni consultas adicionales por regla. Hibernate mapea el JSON como texto serializado por el mismo mapper JSON de la API; leer no vuelve a escribir ni normaliza registros históricos. Flyway V1, sus restricciones y su trigger permanecen intactos; no se necesita V2 y Hibernate solo valida el esquema.

La carga inicial valida cada perfil y usa una inserción HQL de entidad con `on conflict (id) do nothing`, ejecutada por el repositorio JPA. No usa JDBC ni SQL nativo en producción, no hace `merge` de publicaciones existentes y conserva la idempotencia incluso entre arranques concurrentes. La revisión de cliente no es un campo ORM `@Version`: la exclusión de escritura se obtiene mediante `PESSIMISTIC_WRITE` y la comparación explícita de revisión dentro de la transacción. Las escrituras se vacían antes de responder para que las restricciones de base mantengan sus respuestas 409.

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

Las 26 pruebas (incluidas las 21 originales) cubren además registros publicados preexistentes insertados por SQL aislado, cargas iniciales sucesivas y concurrentes, revisión desactualizada tras una edición válida y una carrera entre edición y publicación sin pérdida de contenido. Las regresiones adicionales comparan el hash de las filas antes y después de cada rechazo, comprueban JSONB de tipo arreglo y prueban que el trigger impide reemplazar reglas publicadas. La comprobación diferencial independiente contrastó cinco respuestas de rechazo con la versión anterior, normalizando solo UUID generados y el orden no significativo de los métodos de `Allow`. Las regresiones de idioma comprueban mensajes en español, estados y claves HTTP, preservación de encabezados y ausencia de cambios en los perfiles ante rechazos. Testcontainers elimina sus contenedores al terminar la JVM.

## Seguridad e integraciones futuras

Es un **MVP local sin autenticación**, no un servicio para Internet. No se habilita CORS permisivo: se usa el proxy del frontend. No existen endpoints de carga/importación ni validación de registros biológicos en servidor; multipart está deshabilitado.

Keycloak deberá integrarse en el límite HTTP mediante Spring Security OAuth2 Resource Server: validación JWT de emisor y audiencia, y autorización explícita para consultar, editar y publicar perfiles antes de invocar el servicio. Antes de exponerlo se requieren roles, identidad de auditoría, HTTPS, estrategia CSRF adecuada, límites, control de frecuencia y credenciales de base restringidas. No se instala autenticación simulada ni se confía en cabeceras de identidad aportadas por el cliente.

La importación futura debe usar una operación separada de recepción limitada, aislamiento de contenido y validación autoritativa; los datos biológicos nunca deben agregarse al cuerpo de administración de perfiles como atajo de carga.
