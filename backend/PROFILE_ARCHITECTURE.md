# Arquitectura de perfiles

La funcionalidad conserva su API pública y sus tablas existentes. La dependencia apunta hacia el núcleo; ningún tipo HTTP, Spring, JPA, Jakarta o Jackson pertenece al dominio ni a la aplicación.

## Mapa de responsabilidades

- `profile/domain/model`: registros `Profile`, contenido y reglas declarativas. `domain/validation` contiene la validación pura y `domain/exception` los errores de contenido, ausencia y conflicto. Conserva los límites anteriores: nombre 200, versión 100, descripción 10000, hasta 2000 reglas; campo 200, mensaje 2000 y fuente 4000. Solo nombre y versión se recortan; descripción, campo, mensaje y fuente conservan su texto original.
- `profile/application/port/in/ProfileLifecycle`: un contrato de entrada para listar, crear, editar, duplicar, publicar e inicializar.
- `profile/application/service/ProfileService`: orquestación sin anotaciones ni dependencias de infraestructura. Bloquea antes de comprobar estado/revisión; rechaza versiones publicadas, incrementa la revisión explícita y valida también duplicados/semillas.
- `profile/application/port/out/ProfileStore`: capacidades de almacenamiento, incluida lectura bloqueada e inserción idempotente de semillas. No expone entidades ni tipos de transacción.
- `profile/infrastructure/adapter/in/web`: controlador delgado que solo vincula rutas, validación y estados HTTP. `service/ProfileWebService` coordina el puerto de aplicación y `mapper/ProfileHttpMapper`; comprueba bytes y exige cuerpo vacío al publicar. Los DTO están separados en `dto/req` y `dto/res`, con Bean Validation en entrada y cadenas de transporte en salida, sin tipos del dominio.
- `profile/infrastructure/adapter/in/bootstrap`: lectura del recurso existente e invocación única de `initialize` con todas las semillas.
- `profile/infrastructure/adapter/json`: representaciones externas con enumerados textuales estrictos; números y booleanos no se convierten en enumerados. Se reutilizan al leer HTTP, semillas y reglas persistidas, sin introducir anotaciones en el núcleo.
- `profile/infrastructure/adapter/out/database`: adaptador `JpaProfileStore` con entidad en `entity`, repositorio Spring Data JPA en `repository` y mapeador JSONB en `mapper`. La entidad conserva getters JavaBean y recibe valores de persistencia, nunca un objeto del dominio; su enumerado de estado es propio. `ProfilePersistenceMapper` convierte todos los campos, incluidos estado y reglas, y actualiza la instancia administrada sin cambiar su identidad. El mapeador HTTP no conoce este mapeador ni la entidad.
- `profile/infrastructure/config/ProfileBeanConfig.java`: composición explícita; `infrastructure/transaction/TransactionalProfileLifecycle` decora todos los casos de uso.

## Construcción y conversión

`Profile.builder()` nombra los campos de la construcción larga y `toBuilder()` permite publicar cambiando solo estado/revisión. Es Java puro, sin Lombok ni normalización implícita: el constructor y el builder pueden representar datos históricos y semillas que el caso de uso debe validar. `ProfileService.content` conserva la validación existente, el recorte exclusivo de nombre/versión y la copia inmutable de reglas.

Un builder construye un modelo con valores ya elegidos; un mapper convierte representaciones entre fronteras. Los mappers de infraestructura usan el builder para reconstruir `Profile` sin introducir reglas nuevas ni alterar texto persistido. Las conversiones HTTP producen `Profile.Content` y respuestas de transporte; la aplicación nunca recibe DTO HTTP. La fachada `infrastructure/adapter/in/web/service/ProfileWebService` es coordinación de transporte, no un servicio de aplicación: usa el mapper e invoca `ProfileLifecycle`, sin trasladar reglas de negocio al controller.

## Transacción y concurrencia

HTTP/bootstrap reciben únicamente el puerto decorado. Cada operación completa se ejecuta dentro de una transacción Spring; `list` es de solo lectura. El caso de uso puro no es un bean invocable fuera del decorador.

La edición/publicación mantiene `PESSIMISTIC_WRITE` desde la lectura hasta validar, reemplazar y hacer `flush`. La revisión sigue siendo un contador explícito, **no** `@Version`. El adaptador recupera la misma entidad administrada al reemplazarla; no hace merge de una instantánea desconectada. El JSONB se reemplaza como un solo valor. Las inserciones ordinarias usan `saveAndFlush`; siguen vigentes los conflictos únicos y el trigger de inmutabilidad de PostgreSQL.

La inicialización completa, no cada inserción individual, comparte una transacción. La inserción HQL conserva `on conflict (id) do nothing`; no sobrescribe semillas ya persistidas ni sus revisiones. Un error posterior revierte las inserciones anteriores de esa llamada. Los recursos, esquema e identificadores existentes no cambian.

## Contrato y pruebas

Se mantienen `GET /api/profiles`, `POST /api/profiles`, `PUT /api/profiles/{id}`, `POST /api/profiles/{id}/duplicate` y `POST /api/profiles/{id}/publish`, con los mismos estados y JSON. Por ejemplo, un borrador empieza en `DRAFT`/revisión `0`; editar incrementa a `1` y publicar a `PUBLISHED`/`2`. Duplicar crea un identificador nuevo, estado `DRAFT` y revisión `0` sin alterar la fuente.

Los errores puros `ProfileNotFoundException` y `ProfileValidationException` se traducen en el manejador HTTP compartido a 404 (`No se encontró el perfil.`) y 400 (`El contenido del perfil no es válido.`), conservando los títulos `No encontrado` y `Solicitud incorrecta`. `ProfileConflictException` pertenece también a `profile/domain/exception`; su traducción HTTP sigue siendo responsabilidad del manejador compartido.

La convención `dto/req` y `dto/res` separa cuerpos de negocio sin modificar sus claves JSON. Se conservan parámetros de ruta, `ProblemDetail` y operaciones sin cuerpo: GET y publicación no requieren req ficticios. La comprobación de cuerpo vacío ocurre antes de invocar el caso de uso.

`ProfileBuilderTests`, `ProfileHttpMapperTests` y `ProfilePersistenceMapperTests` cubren construcción con nombres, copia de estado, conversiones req/res, texto original, round-trip JSONB y actualización de la misma entidad sin cambiar su identificador. Aprobaron en la ejecución focalizada de ocho pruebas junto al mapper HTTP del catálogo; esas ocho están incluidas en las **171 pruebas backend de 13 clases actuales**, con cero fallos, errores u omisiones y paquete aprobado. El diferencial actual contra `af5edab` conservó **50/50 observaciones HTTP idénticas** de estado, cuerpo exacto y encabezados. La recuperación de las observaciones actuales desde XML Surefire no repitió la suite. El cierre nativo sigue pendiente; las cifras siguientes son históricas.

`ProfileUseCaseTests` añade pruebas JUnit sin Spring con un puerto falso para ciclo de vida, revisión, inmutabilidad, preservación de texto, límites y semillas. No sustituye las pruebas existentes de MockMvc/PostgreSQL: estas conservan cobertura del JSONB, conflictos únicos, trigger, carreras de edición/publicación e inicialización concurrente. `ProfileContractTests` sigue emitiendo observaciones públicas con reloj fijo y normalización de UUID; no consulta historia Git. En la aceptación hexagonal anterior, la verificación independiente ejecutó92pruebas de perfil y50observaciones HTTP idénticas al baseline; una sonda adicional comprobó el proxy real y el rollback por conflicto SQL. Esas garantías quedaron como dos regresiones durables. La aceptación integrada del padre ejecutó94pruebas de perfil dentro de160totales, con paquete y contrato diferencial aprobados. Ver [VERIFICATION.md](../VERIFICATION.md) para comandos, fallos previos y limitaciones; esto no implica aprobación nativa.
