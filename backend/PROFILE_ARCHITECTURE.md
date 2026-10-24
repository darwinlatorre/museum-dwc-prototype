# Arquitectura de perfiles

La funcionalidad conserva su API pública y sus tablas existentes. La dependencia apunta hacia el núcleo; ningún tipo HTTP, Spring, JPA, Jakarta o Jackson pertenece al dominio ni a la aplicación.

## Mapa de responsabilidades

- `profile/domain`: registros `Profile`, contenido y reglas declarativas, validación pura y errores de contenido/no encontrado. Conserva los límites anteriores: nombre 200, versión 100, descripción 10000, hasta 2000 reglas; campo 200, mensaje 2000 y fuente 4000. Solo nombre y versión se recortan; descripción, campo, mensaje y fuente conservan su texto original.
- `profile/application/port/in/ProfileLifecycle`: un contrato de entrada para listar, crear, editar, duplicar, publicar e inicializar.
- `profile/application/usecase/ProfileService`: orquestación sin anotaciones ni dependencias de infraestructura. Bloquea antes de comprobar estado/revisión; rechaza versiones publicadas, incrementa la revisión explícita y valida también duplicados/semillas.
- `profile/application/port/out/ProfileStore`: capacidades de almacenamiento, incluida lectura bloqueada e inserción idempotente de semillas. No expone entidades ni tipos de transacción.
- `profile/adapter/in/http`: controlador y mapeador HTTP; DTO separados en `dto/req` y `dto/res`, con Bean Validation en entrada. La publicación comprueba bytes y exige cuerpo vacío.
- `profile/adapter/in/bootstrap`: lectura del recurso existente e invocación única de `initialize` con todas las semillas.
- `profile/adapter/json`: representaciones externas con enumerados textuales estrictos; números y booleanos no se convierten en enumerados. Se reutilizan al leer HTTP, semillas y reglas persistidas, sin introducir anotaciones en el núcleo.
- `profile/adapter/out/persistence`: entidad con getters JavaBean, repositorio Spring Data JPA, mapeador JSONB y adaptador de `ProfileStore`. El mapeador HTTP no conoce este mapeador ni la entidad.
- `profile/configuration`: composición explícita y decorador transaccional de todos los casos de uso.

## Transacción y concurrencia

HTTP/bootstrap reciben únicamente el puerto decorado. Cada operación completa se ejecuta dentro de una transacción Spring; `list` es de solo lectura. El caso de uso puro no es un bean invocable fuera del decorador.

La edición/publicación mantiene `PESSIMISTIC_WRITE` desde la lectura hasta validar, reemplazar y hacer `flush`. La revisión sigue siendo un contador explícito, **no** `@Version`. El adaptador recupera la misma entidad administrada al reemplazarla; no hace merge de una instantánea desconectada. El JSONB se reemplaza como un solo valor. Las inserciones ordinarias usan `saveAndFlush`; siguen vigentes los conflictos únicos y el trigger de inmutabilidad de PostgreSQL.

La inicialización completa, no cada inserción individual, comparte una transacción. La inserción HQL conserva `on conflict (id) do nothing`; no sobrescribe semillas ya persistidas ni sus revisiones. Un error posterior revierte las inserciones anteriores de esa llamada. Los recursos, esquema e identificadores existentes no cambian.

## Contrato y pruebas

Se mantienen `GET /api/profiles`, `POST /api/profiles`, `PUT /api/profiles/{id}`, `POST /api/profiles/{id}/duplicate` y `POST /api/profiles/{id}/publish`, con los mismos estados y JSON. Por ejemplo, un borrador empieza en `DRAFT`/revisión `0`; editar incrementa a `1` y publicar a `PUBLISHED`/`2`. Duplicar crea un identificador nuevo, estado `DRAFT` y revisión `0` sin alterar la fuente.

Los errores puros `ProfileNotFoundException` y `ProfileValidationException` se traducen en el manejador HTTP compartido a 404 (`No se encontró el perfil.`) y 400 (`El contenido del perfil no es válido.`), conservando los títulos `No encontrado` y `Solicitud incorrecta`. `ProfileConflictException` permanece en `shared/exceptions`.

`ProfileUseCaseTests` añade pruebas JUnit sin Spring con un puerto falso para ciclo de vida, revisión, inmutabilidad, preservación de texto, límites y semillas. No sustituye las pruebas existentes de MockMvc/PostgreSQL: estas conservan cobertura del JSONB, conflictos únicos, trigger, carreras de edición/publicación e inicialización concurrente. `ProfileContractTests` sigue emitiendo observaciones públicas con reloj fijo y normalización de UUID; no consulta historia Git. La verificación independiente ejecutó92pruebas de perfil y50observaciones HTTP idénticas al baseline; una sonda adicional comprobó el proxy real y el rollback por conflicto SQL. Esas garantías quedaron como dos regresiones durables. La aceptación integrada del padre ejecutó94pruebas de perfil dentro de160totales, con paquete y contrato diferencial aprobados. Ver [VERIFICATION.md](../VERIFICATION.md) para comandos, fallos previos y limitaciones; esto no implica aprobación nativa.
