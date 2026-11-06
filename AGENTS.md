# Instrucciones para agentes

## Proyecto y referencias

Módulo del Museo de Historia Natural de la Universidad del Cauca: Angular/PrimeNG, Spring Boot con Spring Data JPA y PostgreSQL. Es un MVP local, no un despliegue de producción.

- `README.md`: ejecución, alcance y restricciones.
- `frontend/README.md` y `backend/README.md`: arquitectura y contratos.
- `frontend/ARCHITECTURE.md`: organización por funcionalidades y límites de dependencia.
- `frontend/DESIGN_SYSTEM.md`: tokens, primitivas, preset y propiedad de estilos.
- `frontend/QUERY_USAGE.md`: cliente Query compartido, cancelación, invalidaciones y salvedades.
- `backend/RECORD_SOURCES_ARCHITECTURE.md` y `backend/CATALOG_ARCHITECTURE.md`: puertos, composición y fronteras transaccionales hexagonales.
- `sources/README.md`: fuentes oficiales y atribuciones.
- `VERIFICATION.md`: evidencia observada, historial y limitaciones.
- `odd/tasks/normalization-simplification.md`, `design/normalization-live-preview/simplification-contract.md` y `frontend/NORMALIZATION.md`: reglas fijas y revisión compacta vigentes, con aceptación acotada S1–S5. `odd/tasks/normalization-live-preview.md` y el contrato anterior conservan la historia cerrada; no trasladar sus switches/defaults opt-in a la UI actual ni reabrir trabajo anterior.
- `odd/tasks/`: especificaciones, decisiones y tareas. La evolución `museum-evolution.md` tiene T1–T5 completadas; el refinamiento Java/UX está en `museum-refinement.md`. El reemplazo de perfiles por configuración global está cerrado en `global-validation.md`; el administrador visual y la alineación de módulos se registran en `record-sources-admin.md`. No reabrir trabajo anterior sin una nueva necesidad.

## Invariantes

- Analizar CSV/XLSX exclusivamente en el navegador mediante Web Workers. No enviar archivos, nombres, celdas ni registros biológicos al servidor.
- Preservar datos originales, textos arbitrarios y espacios. El usuario autorizó retirar definitivamente los perfiles históricos mediante V4: eliminar exclusivamente tabla `profiles`, su trigger y la función `preserve_published_profile()`, sin CASCADE general. No modificar V1/V2 ya aplicadas ni borrar catálogo, configuración nueva, historial Flyway o volúmenes. Probar la transición en PostgreSQL desechable; no ejecutar borrado manual sobre bases existentes. Los requisitos activos son configuración global revisada, no nuevas versiones de perfiles.
- Mantener claves/enumerados de API, identificadores y URI oficiales; interfaz y documentación en español. No traducir citas oficiales ni contenido del usuario automáticamente.
- Usar únicamente TDWG como autoridad del vocabulario. SiB aporta requisitos de contexto, no términos inventados; la política activa de obligatoriedad es la solicitada en `global-validation.md`. Conservar categorías ausentes y la última instantánea válida ante fallos.
- Conservar bloqueos, control de revisión e inmutabilidad en PostgreSQL. Acceso productivo mediante entidades y repositorios JPA; migraciones aditivas.
- No leer, modificar, borrar ni versionar los `.env` reales. `.env.example` queda gestionado manualmente por el humano: no acceder por otro canal ni stagearlo para evadir la protección del harness. La petición actual autoriza convertir `docker-compose.yml` en Compose principal y agregar `start.sh`; `compose.mvp.yml` se retira del uso. Conservar proyecto/servicio/volumen aislados del MVP, nunca reutilizar `postgres_data` ni arrancar/parar servicios existentes durante las pruebas. Validar con variables ficticias y recursos aislados.
- Mantener servicios en localhost. Autenticación e importación biológica al servidor son trabajo futuro, no funcionalidades existentes.
- Backend hexagonal por funcionalidad (`recordsources`, `catalog`): `domain` y `application` Java puros, sin Spring/Jakarta/JPA/Jackson/CommonsCSV, sin DTO HTTP ni adaptadores. Puertos propiedad de aplicación, implementados por adaptadores; composición explícita en `infrastructure/config/*BeanConfig.java`. No crear interfaces sin una frontera real.
- Generar builders/constructores/accesores apropiados con Lombok; en el núcleo solo `@Builder` y `@RequiredArgsConstructor` como anotaciones source-only, nunca dependencias runtime. No usar `@Data`, igualdad, hash o toString automáticos en entidades JPA. Mappers estructurales con MapStruct y `BackendMapperConfig`, composición explícita en BeanConfig, codecs JSON mediante `@Context` y actualizaciones administradas con `@MappingTarget` que ignoran identidad. Usar imports y nombres cortos, renombrando adaptadores cuando colisionan con puertos.
- Separar DTO de entrada/salida en `<feature>/infrastructure/adapter/in/web/dto/req` y `res`; mappers HTTP y de persistencia separados. Enumerados JSON estrictos y Bean Validation en adaptadores, invariantes también en dominio. Usar getters JavaBean en entidades y errores propios, traducidos exclusivamente en HTTP.
- La transacción de configuración global envuelve el caso de uso completo (lock→revisión→validación→save/flush), incluido bootstrap idempotente; no liberar el bloqueo entre llamadas de repositorio. Catálogo: inicio/activación/fallo son atómicos, descarga/análisis fuera de transacción, política ejecutada contra snapshot bloqueado. No agregar dependencias productivas entre configuración y catálogo.
- En Fuentes de registros biológicos, Obligatorio/Opcional conserva el campo visible y persistido; Quitar lo retira de ambas listas de la fuente, no del vocabulario. `optionalFields` ausente en lectura legada significa `[]`; omitido en PUT conserva los opcionales existentes bajo el mismo lock/revisión, retirando únicamente promociones explícitas a obligatorio. Listas disjuntas, literales y sin duplicados: máximo 200 caracteres/campo y 500 campos combinados por fuente. No agregar migraciones para este estado ni usar opcionales para exigir presencia en el diagnóstico; las validaciones básicas siguen activas.
- Mantener pruebas de configuración en su paquete `recordsources`, con JPA/EntityManager y PostgreSQL desechable. Conservar cobertura de concurrencia, bootstrap, rechazo sin efectos y migración de retiro acotada: los perfiles/trigger/función legados desaparecen y catálogo/configuración/Flyway permanecen; no sustituirla por mocks. Las rutas activas de perfiles se retiran por pedido explícito.
- Frontend por funcionalidad: `features/catalog`, `features/record-sources`, `features/importer`. Modelos con su propietario; `core/api` solo metadatos y `core/i18n` presentación. No agregar componentes regados en la raíz ni un cajón `shared/models`.
- Normalización: las seis reglas están siempre ON SOLO en preview de Normalizar y al Aplicar, sin switches de reglas; el diagnóstico inicial sigue crudo y los defaults de helpers compartidos no cambian. Aplicar es explícito: formatos/vistas nunca validan automáticamente. Recalcular desde originales inmutables en worker persistente; conservar sesiones/generaciones y ventanas acotadas, sin dataset en Query/API. Con cambios por defecto compara valores en TODAS las columnas fuente, incluidas ocultas/fuera de ventana; ambos duplicados son avisos globales sin borrado y no constituyen cambios de valor. Todos y ocultar columnas solo cambian presentación, sin recalcular ni reenviar originales. Conversiones solo por destino DwC, precisión literal y modos ambiguos consentidos; nunca coerción de IDs, pérdida de ceros o cambio de case. Preservar Escape/foco, reduced-motion del pseudo-elemento scoped y acciones44px de hoja/footer SOLO Normalizar.
- Contratos entre funcionalidades con `import type`, no vistas desde `core`/`shared`. Mantener el motor independiente de transporte/vistas y la URL de módulo del worker relativa a su workbench.
- Reutilizar `shared/design-system`: una paleta CSS, `MuseumPreset` conectado en `app.config.ts`, tokens de espacios/radios y primitivas comunes. Estilos de feature globales importados desde `src/styles.scss` para conservar overlays; no duplicar colores o reglas para cada control. No cambiar el comportamiento nativo de selects sin una necesidad explícita.
- Reutilizar el selector DwC de `shared/ui/dwc-picker` y sus contratos de valor libre, limpieza y deshabilitación; preservar el workbench montado y las guardas de navegación/generación.
- TanStack Query usa un cliente raíz; resolverlo con `inject(QueryClient)`, no el alias deprecado `injectQueryClient`. Mantener claves vigentes, callbacks, cancelación `AbortSignal` y políticas existentes; la clave de perfiles se reemplaza por `validation-configuration` por el retiro autorizado; no agregar un cliente por feature ni convertir transporte/caché como parte de un cambio de DI. El cache contiene solo metadatos.
- La sincronización manual y la programada comparten la misma maquinaria. Evaluar `SUCCESS`/`FAILED`/`SUPERSEDED`, no solo HTTP200; los intentos viejos nunca reemplazan activaciones ni fallos nuevos.
- No sobrescribir un JAR en ejecución: ejecutar una copia separada del artefacto de compilación. El contenedor copia el JAR compilado en su imagen y no monta el artefacto del host.
- `start.sh` valida Compose con el `.env` raíz sin imprimirlo, compila frontend/backend y espera salud de los tres servicios. No ejecutarlo contra datos vivos para verificarlo: usar proyecto, volumen y puertos propios con valores ficticios. Las pruebas de arranque y los Dockerfiles nunca deben incluir dotenv en los contextos; conservar también `3rdpartylicenses.txt` del build Angular.
- Publicar cambios y crear PR únicamente por pedido explícito, en el repositorio autorizado. La elección de un solo PR para configuración global no autoriza crearlo ni publicarlo; no aprobar ni fusionar por cuenta propia.

## Comprobaciones

Desde la raíz:

```bash
python3 scripts/test_seeds.py
python3 -B scripts/test_start.py
bash -n start.sh backend/docker-healthcheck.sh
(cd frontend && node scripts/check-architecture.mjs && npm test -- --watch=false && npm run build)
(cd backend && python3 -B scripts/test_codegen.py && python3 scripts/test_architecture.py && python3 scripts/check_architecture.py && bash ./mvnw test && bash ./mvnw package -DskipTests)
git diff --check
```

Para reducir presión del host en esta sesión se usó `.browser/frontend-architecture/vitest.serial.config.mjs` con `maxWorkers: 1` y `fileParallelism: false`, mediante `npm test -- --watch=false --runner-config ../.browser/frontend-architecture/vitest.serial.config.mjs`. Es configuración local ignorada, no cambia aserciones ni límites; no existe necesariamente en un clon nuevo. Un timeout se registra como fallo, no se reintenta automáticamente ni se suben límites para ocultarlo.

Las pruebas backend requieren Docker y crean PostgreSQL desechable mediante Testcontainers; no usan la base viva del MVP. La ejecución manual de la aplicación usa la base aislada indicada en `README.md`. No sustituir ninguna por la base original. Para documentación pasiva, usar comprobaciones estructurales proporcionales; no repetir suites innecesariamente.

## Verificación de navegador

- Utilizar un navegador real con agent-browser y una sesión propia. Interactuar mediante controles públicos; no inyectar estado para simular que una funcionalidad funciona.
- Comprobar resultados observables: acciones, mensajes, selección, navegación, foco, Escape, desplazamiento y geometría en escritorio/móvil. Abrir e inspeccionar las capturas, no solo generarlas. Esperar el estado observable final de overlays/animaciones antes de medir o navegar; actualizar refs tras cambiar de sección y usar cierre explícito cuando corresponda.
- Contrastar descargas JSON/CSV, HAR y GET públicos antes/después cuando corresponda. Distinguir tráfico emitido de una respuesta HTTP exitosa.
- Guardar capturas y descargas dentro de `.browser/`; configurar `--screenshot-dir` explícitamente. Cerrar la sesión propia al terminar.
- Obtener autorización específica antes de acceder fuera del proyecto. Un permiso histórico para un caché no autoriza otra sesión ni limpiar archivos externos.
- Registrar comandos, resultados, incidentes y límites en `VERIFICATION.md`. Un error de automatización no demuestra un defecto del producto; un informe delegado no reemplaza su contraste.

## Estado y comunicación

- Responder en español con el detalle adecuado a cada pedido. Separar trabajo pendiente, limitaciones aceptadas y funcionalidades futuras.
- La auditoría npm agotó el tiempo autorizado y quedó pendiente con aceptación humana: no repetirla ni afirmar que aprobó.
- La revisión nativa no produjo aprobación. La advertencia de tamaño del bundle y la captura accidental externa están documentadas; no inventar su resolución.
- No confundir la evidencia histórica con pruebas nuevas. La evolución anterior registró118pruebas; el refinamiento Java/UX comprobó145(68backend,71frontend,6semillas). La reorganización frontend comprobó89pruebasfrontend ybuild, más Nodechecker yChromium. La aceptación hexagonal ejecutó160pruebasbackend+package y50observacionesHTTPidénticas; la revisión posterior TanStack comprobó99pruebasfrontend+build (padrecontraste10focalizadas), sin navegador nuevo; no sumar resultados históricos como si fueran una nueva suite integral. No implica una auditoría exhaustiva de seguridad o accesibilidad.
