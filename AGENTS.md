# Instrucciones para agentes

## Proyecto y referencias

Módulo del Museo de Historia Natural de la Universidad del Cauca: Angular/PrimeNG, Spring Boot con Spring Data JPA y PostgreSQL. Es un MVP local, no un despliegue de producción.

- `README.md`: ejecución, alcance y restricciones.
- `frontend/README.md` y `backend/README.md`: arquitectura y contratos.
- `frontend/ARCHITECTURE.md`: organización por funcionalidades y límites de dependencia.
- `frontend/DESIGN_SYSTEM.md`: tokens, primitivas, preset y propiedad de estilos.
- `frontend/QUERY_USAGE.md`: cliente Query compartido, cancelación, invalidaciones y salvedades.
- `backend/PROFILE_ARCHITECTURE.md` y `backend/CATALOG_ARCHITECTURE.md`: puertos, composición y fronteras transaccionales hexagonales.
- `sources/README.md`: fuentes oficiales y atribuciones.
- `VERIFICATION.md`: evidencia observada, historial y limitaciones.
- `odd/tasks/`: especificaciones, decisiones y tareas. La evolución `museum-evolution.md` tiene T1–T5 completadas; el refinamiento Java/UX está en `museum-refinement.md`. No reabrir trabajo anterior sin una nueva necesidad.

## Invariantes

- Analizar CSV/XLSX exclusivamente en el navegador mediante Web Workers. No enviar archivos, nombres, celdas ni registros biológicos al servidor.
- Preservar datos originales, textos arbitrarios, espacios y versiones publicadas. Modificar reglas publicadas mediante una nueva versión.
- Mantener claves/enumerados de API, identificadores y URI oficiales; interfaz y documentación en español. No traducir citas oficiales ni contenido del usuario automáticamente.
- Usar únicamente TDWG como autoridad del vocabulario. SiB aporta requisitos de perfiles, no términos inventados. Conservar categorías ausentes y la última instantánea válida ante fallos.
- Conservar bloqueos, control de revisión e inmutabilidad en PostgreSQL. Acceso productivo mediante entidades y repositorios JPA; migraciones aditivas.
- No leer, modificar, borrar ni versionar los `.env` reales. `.env.example` queda gestionado manualmente por el humano: no acceder por otro canal ni stagearlo para evadir la protección del harness. La petición actual autoriza convertir `docker-compose.yml` en Compose principal y agregar `start.sh`; `compose.mvp.yml` se retira del uso. Conservar proyecto/servicio/volumen aislados del MVP, nunca reutilizar `postgres_data` ni arrancar/parar servicios existentes durante las pruebas. Validar con variables ficticias y recursos aislados.
- Mantener servicios en localhost. Autenticación e importación biológica al servidor son trabajo futuro, no funcionalidades existentes.
- Backend hexagonal por funcionalidad (`profile`, `catalog`): `domain` y `application` Java puros, sin Spring/Jakarta/JPA/Jackson/CommonsCSV, sin DTO HTTP ni adaptadores. Puertos propiedad de aplicación, implementados por adaptadores; composición explícita en `configuration`. No crear interfaces sin una frontera real.
- Separar DTO de entrada/salida en `profile/adapter/in/http/dto/req` y `res`; mappers HTTP y de persistencia separados. Enumerados JSON estrictos y Bean Validation en adaptadores, invariantes también en dominio. Usar getters JavaBean en entidades y errores propios, traducidos exclusivamente en HTTP.
- La transacción de perfil envuelve el caso de uso completo (lock→revisión/estado→transformación→save/flush), incluido bootstrap completo; no liberar el bloqueo entre llamadas de repositorio. Catálogo: inicio/activación/fallo son atómicos, descarga/análisis fuera de transacción, política ejecutada contra snapshot bloqueado. No agregar dependencias productivas entre perfil y catálogo.
- Mantener las pruebas de perfiles en su paquete `profile`, con JPA/EntityManager y PostgreSQL desechable; no sustituirlas por mocks que eliminen cobertura de trigger o concurrencia.
- Frontend por funcionalidad: `features/catalog`, `features/profiles`, `features/importer`. Modelos con su propietario; `core/api` solo metadatos y `core/i18n` presentación. No agregar componentes regados en la raíz ni un cajón `shared/models`.
- Contratos entre funcionalidades con `import type`, no vistas desde `core`/`shared`. Mantener el motor independiente de transporte/vistas y la URL de módulo del worker relativa a su workbench.
- Reutilizar `shared/design-system`: una paleta CSS, `MuseumPreset` conectado en `app.config.ts`, tokens de espacios/radios y primitivas comunes. Estilos de feature globales importados desde `src/styles.scss` para conservar overlays; no duplicar colores o reglas para cada control. No cambiar el comportamiento nativo de selects sin una necesidad explícita.
- Reutilizar el selector DwC de `shared/ui/dwc-picker` y sus contratos de valor libre, limpieza y deshabilitación; preservar el workbench montado y las guardas de navegación/generación.
- TanStack Query usa un cliente raíz; resolverlo con `inject(QueryClient)`, no el alias deprecado `injectQueryClient`. Mantener claves, callbacks, cancelación `AbortSignal` y políticas existentes; no agregar un cliente por feature ni convertir transporte/caché como parte de un cambio de DI. El cache contiene solo metadatos.
- La sincronización manual y la programada comparten la misma maquinaria. Evaluar `SUCCESS`/`FAILED`/`SUPERSEDED`, no solo HTTP200; los intentos viejos nunca reemplazan activaciones ni fallos nuevos.
- No sobrescribir un JAR en ejecución: ejecutar una copia separada del artefacto de compilación. El contenedor copia el JAR compilado en su imagen y no monta el artefacto del host.
- `start.sh` valida Compose con el `.env` raíz sin imprimirlo, compila frontend/backend y espera salud de los tres servicios. No ejecutarlo contra datos vivos para verificarlo: usar proyecto, volumen y puertos propios con valores ficticios. Las pruebas de arranque y los Dockerfiles nunca deben incluir dotenv en los contextos; conservar también `3rdpartylicenses.txt` del build Angular.
- Publicar cambios y crear PR únicamente por pedido explícito, en el repositorio autorizado. El PR de arranque actual está autorizado; no aprobar ni fusionar: el humano se encarga de aceptarlo.

## Comprobaciones

Desde la raíz:

```bash
python3 scripts/test_seeds.py
python3 -B scripts/test_start.py
bash -n start.sh backend/docker-healthcheck.sh
(cd frontend && node scripts/check-architecture.mjs && npm test -- --watch=false && npm run build)
(cd backend && python3 scripts/test_architecture.py && python3 scripts/check_architecture.py && bash ./mvnw test && bash ./mvnw package -DskipTests)
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
