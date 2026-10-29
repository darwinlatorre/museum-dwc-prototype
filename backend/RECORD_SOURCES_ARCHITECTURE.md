# Fuentes de registros biológicos: fronteras y transacción

`co.edu.unicauca.backend.recordsources` es el módulo propietario de la configuración global de «Fuentes de registros biológicos», alineado con `features/record-sources` en Angular. Reemplaza el producto de perfiles con una única configuración editable por contexto. Catálogo es independiente: ninguna funcionalidad importa clases productivas de la otra.

El nombre del módulo es organizativo: se preservan `/api/validation-configuration`, las claves `collection`/`permit`/`sampling`/`marine`/`other`, los campos JSON y la revisión. No se renombran entidades, tablas, columnas, migraciones ni semillas; tampoco se agrega CRUD de fuentes. Los casos de uso conservan los nombres `Configuration*` y «Contexto» no cambia en el análisis.

Código y pruebas pertenecen a `recordsources`; `scripts/check_architecture.py` comprueba paquetes coherentes con sus directorios, ausencia de imports del namespace retirado y separación respecto de catálogo.

## Recorrido de una edición

`ConfigurationController` → `ConfigurationOperations` decorado → `ConfigurationService` → `ConfigurationStore` → `JpaConfigurationStore`.

| Frontera | Responsabilidad |
|---|---|
| `domain/model` | Registros `ValidationConfiguration`, `ContextFields` y cinco contextos |
| `domain/validation` | Cinco claves únicas, límites, texto no vacío/duplicado y copia inmutable sin trim |
| `domain/exception` | Errores puros de validación y revisión |
| `application/port/in` | Leer, reemplazar con revisión e inicializar |
| `application/port/out` | Lectura, bloqueo, reemplazo e inserción idempotente |
| `application/service` | Bloquear, comparar revisión, validar, incrementar y guardar |
| `infrastructure/adapter/in/web` | HTTP, Bean Validation y mapper req/res separado |
| `infrastructure/adapter/json` | Contrato estricto común a HTTP, semillas y JSONB; sin coerción numérica |
| `infrastructure/adapter/out/database` | Entidad JPA, repositorio y mapper de persistencia con codec `@Context` |
| `infrastructure/adapter/in/bootstrap` | Recurso local validado; nunca valores derivados de perfiles históricos |
| `infrastructure/transaction` | Una transacción por caso de uso, no por acceso al repositorio |
| `infrastructure/config` | `ConfigurationBeanConfig`: composición explícita y mappers generados |

El núcleo no importa Spring, Jakarta, Jackson, JPA, Commons CSV ni DTO HTTP. Solo admite los generadores source-only Lombok `Builder` y `RequiredArgsConstructor`. Los mappers MapStruct comparten `BackendMapperConfig`, se obtienen con `Mappers.getMapper` en BeanConfig y no contienen política de negocio. Persistencia y HTTP son mappers separados; comparten únicamente el codec JSON dedicado, no DTO HTTP ni entidades.

## Atomicidad y revisión

`TransactionalConfigurationOperations` es la única implementación publicada del puerto de entrada; el caso de uso puro no se registra como bean independiente. `get` es read-only; `update` e `initialize` usan propagación REQUIRED.

La transacción de actualización mantiene `PESSIMISTIC_WRITE` desde `lockGlobal()` hasta `saveAndFlush()`. Se compara la revisión antes de validar el contenido en aplicación. Un cliente obsoleto recibe 409 sin escribir; dos clientes con la misma revisión tienen exactamente un ganador. La revisión explícita no es `@Version`. El mapper usa `@MappingTarget` sobre la entidad administrada e ignora `id`.

Bootstrap valida el documento completo con revisión cero e inserta por HQL `on conflict (id) do nothing`, con flush dentro de la misma transacción. No hace merge ni sustituye configuración existente. La exclusión única de PostgreSQL resuelve el arranque concurrente aun antes de existir la fila; no se usa un inexistente bloqueo de fila como sustituto de esa restricción.

## Esquema y retiro autorizado

V1/V2 permanecen byte a byte. V3 crea una fila global estable (`id smallint=1`) con revisión no negativa y JSONB array. V4 elimina únicamente la tabla `profiles`, su trigger `immutable_published_profile` y la función `preserve_published_profile()`. No hay `CASCADE`, cambios en catálogo, vaciado de volúmenes ni alteración del historial Flyway. El retiro irreversible de publicaciones históricas sustituye la anterior política de preservación por autorización explícita S7.

## Contraste recomendado

1. Revisar V3/V4 y `ConfigurationMigrationTests`: actualización desde V1/V2 con publicaciones, comparación de catálogo e historial y configuración editada antes/después de V4.
2. Revisar decorador, repositorio y `ValidationConfigurationIntegrationTests`: carrera de PUT, estado sin efectos ante rechazo, rollback después de flush y reinicio real.
3. Revisar `ConfigurationMapperTests`/`ConfigurationUseCaseTests`: código generado, identidad administrada, JSON estricto y preservación de texto.
4. Revisar la matriz en el recurso y `scripts/test_seeds.py`: 30/22/10/15/8, disposición opcional solo para colección y evidencia oficial intacta.

Contrato detallado y comandos: [README](README.md). Las pruebas usan exclusivamente PostgreSQL desechable; ningún test versionado depende de historia Git ni snapshots de trabajo.
