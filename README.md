# Gestión y validación de registros biológicos del museo

Primer módulo para el Museo de Historia Natural de la Universidad del Cauca. Permite analizar archivos CSV/XLSX **en el navegador**, validarlos según una configuración global editable por contexto y descargar diagnósticos sin enviar registros biológicos al servidor.

**MVP de desarrollo, no despliegue de producción.** La autenticación y la importación de registros al servidor no están habilitadas. Ambos servidores deben permanecer en la interfaz local. La aplicación no certifica la publicación ante SiB, la taxonomía, los permisos ni las extensiones GGBN.

**Licencias de interfaz:** PrimeNG **21.1.10, edición comunitaria MIT**, temas PrimeUI **2.0.3** y Angular **21.2.25** (CLI/build **21.2.27**). No se utilizan versiones comerciales/LTS ni se requiere una clave PrimeUI. La migración desde la versión 22 fue autorizada; no se ocultaron avisos ni se alteraron mecanismos de licencia. Conservar las licencias incluidas en las dependencias al redistribuir.

**Auditoría pendiente aceptada:** el primer intento agotó 120 segundos. El único intento adicional autorizado, `timeout 300s npm audit --json`, terminó con código 124 tras cinco minutos sin salida. El usuario aceptó explícitamente entregar con esa comprobación pendiente: «Si acepto.». No se afirma que la auditoría haya aprobado ni que las dependencias estén libres de vulnerabilidades. Evidencia: [VERIFICATION.md](VERIFICATION.md).

## Ejecución local

Para contenedores: Docker con Compose **2.24.4 o posterior** (`up --wait --wait-timeout`). Las imágenes compilan las aplicaciones: el host no necesita Node, npm, Java ni Maven. Los builds requieren Internet. Para ejecutar fuera de Docker se mantienen Node.js **24**, npm y Java **27**, con Maven Wrapper incluido.

1. Gestionar manualmente los archivos raíz `.env` (producción) y `.env.dev` (desarrollo), usando sus plantillas existentes. Las plantillas y los dotenv se dejan intactos en este cambio: retirar manualmente las entradas antiguas de `SERVER_ADDRESS`. Completar `DB_NAME`, `DB_USER` y `DB_PASSWORD` con valores no vacíos. No guardar credenciales reales en Git ni compartir `docker compose config` sin `--quiet`.
2. Crear la red externa si no existe (`docker network create proxy`, o el nombre de `TRAEFIK_NETWORK`) y ejecutar Compose desde la raíz:

   ```bash
   docker compose --env-file .env -f compose.yml up --build -d --wait --wait-timeout 180
   ```

3. Abrir http://localhost:8081 (o `FRONTEND_HTTP_PORT`). Nginx sirve Angular como archivos estáticos; el navegador contacta directamente `environment.baseUrl`, sin proxy API. Flyway crea el esquema; la primera ejecución carga el catálogo y la configuración global de los cinco contextos. Los reinicios no sobrescriben ajustes guardados.

Compose interpreta dotenv; no ejecutar `source` ni `eval` sobre esos archivos. Las variables ya exportadas en la terminal tienen la precedencia normal de Compose; evitar valores antiguos exportados. Los Dockerfiles instalan dependencias y compilan Angular y Spring dentro de etapas de build.

`--wait` espera la salud de los tres servicios, con un límite de 180 segundos; compilaciones y descargas pueden tardar más. Ante un error, revisar el fallo antes de repetir: Compose no revierte compilados ni elimina contenedores parcialmente iniciados. El empaquetado omite pruebas; no reemplaza las comprobaciones de abajo.

### Red, configuración y almacenamiento

`compose.yml` es el manifiesto principal de producción (artefactos compilados, no una habilitación para Internet). `compose.dev.yml` es un manifiesto autónomo con su propio servicio PostgreSQL; ambos integran Traefik bajo el perfil `local-traefik`, sin overlay adicional; el antiguo `compose.mvp.yml` no se usa. Todos los puertos publicados escuchan exclusivamente en `127.0.0.1`: PostgreSQL `${DB_PORT:-5432}` → 5432, API `${SERVER_PORT:-8080}` → `${SERVER_PORT:-8080}` y Nginx `${FRONTEND_HTTP_PORT:-8081}` → 80. Si 5432 está ocupado, elegir otro `DB_PORT` libre en el `.env`, **sin detener otro PostgreSQL**. El backend en contenedor siempre usa `museum-db:5432`, escucha internamente en `0.0.0.0:${SERVER_PORT:-8080}` y no consume `DB_HOST=localhost`; este último sirve para un arranque opcional en el host. La API sigue sin autenticación y no debe exponerse a otras interfaces.

Se conserva el proyecto fijo `universidad`, servicio `museum-db` y clave de volumen `museum_mvp_data`. Compose genera automáticamente el mismo nombre durable **`universidad_museum_mvp_data`** (`proyecto_clave`), sin un `name` explícito ni migración de datos. No cambiar el proyecto ni la clave para simplificar ese nombre. Nunca se reutiliza `universidad_postgres_data` ni el servicio original `postgres`. Antes de arrancar, confirmar que ese volumen MVP es el deseado: si existe, usar sus credenciales vigentes. Cambiar `DB_NAME`, `DB_USER` o `DB_PASSWORD` en dotenv **no renombra ni rota** una base ya inicializada; no borrar el volumen para resolver discrepancias. El arranque puede aplicar las migraciones existentes al volumen MVP, por lo que debe elegirse conscientemente.

El backend recibe únicamente las variables declaradas en `environment`, sin `env_file` ni carga indiscriminada del dotenv. `--env-file .env` o `--env-file .env.dev` sigue seleccionando los valores para interpolar Compose; no se ha retirado esta opción CLI. La conexión interna permanece fija en `museum-db:5432`. `SERVER_PORT` se toma del shell o del archivo seleccionado, con default 8080 si falta o está vacío; el mismo valor configura el proceso, el puerto publicado y el destino del healthcheck. `CORS_ALLOWED_ORIGINS` se entrega como variable sin valor literal: Compose la toma del shell o del archivo seleccionado, y la omite del contenedor si no está definida, conservando el default de Spring sin duplicarlo. El frontend no recibe credenciales de base. `application.yaml` conserva `SERVER_PORT=8080` como default y exige las credenciales de base, sin una contraseña predeterminada. El bind local predeterminado es el literal `127.0.0.1`, sin placeholder de dirección. Los comandos Docker lo sobrescriben con `--server.address=0.0.0.0`: desarrollo mediante `-Dspring-boot.run.arguments`, producción mediante `CMD` junto al `ENTRYPOINT java -jar`. `EXPOSE 8080` es solo metadato de la imagen, no fija el puerto efectivo. Spring conserva sus overrides nativos: un `SERVER_ADDRESS` exportado puede cambiar el bind al ejecutar en el host; retirarlo manualmente, también del shell. No se añade filtrado de entorno. Spring no carga dotenv por sí mismo. El histórico `backend/.env` deja de utilizarse, permanece ignorado y sin modificaciones; el humano puede retirarlo manualmente cuando ya no lo necesite. Para desarrollo host, exportar explícitamente las variables de conexión en la terminal, sin duplicar archivos ni ejecutar dotenv como código, y usar `bash ./mvnw spring-boot:run` desde `backend`; `DB_URL` sigue disponible como override JDBC avanzado para ese modo, no para el stack Compose.

Para detener el stack sin eliminar datos, desde la raíz:

```bash
docker compose --project-name universidad --env-file .env -f compose.yml stop
```

No usar `down -v`, limpiezas de volúmenes ni rotaciones automáticas. Los Dockerfiles tienen etapas `base`, `development`, `build` y `production`. Producción usa la última etapa por defecto, sin repetir `build.target`; desarrollo selecciona `development` explícitamente. Los runtimes reciben el JAR o Angular compilado, incluida `3rdpartylicenses.txt`; las listas de permitidos de `.dockerignore` excluyen dotenv, Git, artefactos host y `node_modules`.

### Desarrollo con código montado

```bash
docker compose --env-file .env.dev -f compose.dev.yml up --build -d --wait
```

Abrir http://localhost:4200 (`FRONTEND_PORT`). Angular CLI escucha dentro del contenedor en 4200 y observa las fuentes con polling. Compose ejecuta `npm start -- --host 0.0.0.0 --port 4200 --poll 1000`, sin proxy ni hooks de configuración runtime. Solo se montan fuentes y configuraciones seleccionadas en solo lectura; `src` ya incluye ambos application environments, sin montaje adicional. No se montan carpetas completas con dotenv ni dependencias del host. Cambios en dependencias requieren reconstruir la imagen.

El entorno del servicio frontend configura exclusivamente `${TRAEFIK_HOST:-localhost}` mediante `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`, opción de Vite usada por Angular. No se pasa `--allowed-hosts`: en CLI 21.2.27 es booleano, no una lista CLI de nombres. Se mantiene la validación de hosts (incluidos los permisos locales nativos de Vite), sin permitir hosts arbitrarios. Este ajuste no cambia `npm start` fuera de Docker ni entrega dotenv al frontend.

El proyecto declarado es `universidad-dev`, con base `museum_dev_data` propia y `target` Java en volumen separado. El backend ejecuta `mvn spring-boot:run`: tras editar Java, ejecutar el mismo comando Compose con `restart backend` en lugar de `up ...`; **no tiene recarga Java automática**. Angular sí dispone de hot reload. Desarrollo y producción comparten los defaults de puertos de base/API: para mantener ambos activos, asignar puertos distintos en `.env.dev` antes de arrancar. No reutilizar el volumen MVP ni parar servicios ajenos para liberar puertos.

### Traefik opcional

Traefik enruta únicamente la página hacia **Nginx** en producción o **Angular CLI** en desarrollo. Después, el navegador consulta directamente la API pública de **Spring Boot → PostgreSQL**; Traefik no enruta `/api/`. Base, backend y frontend siempre pertenecen a `app`, con nombre acotado al proyecto (`universidad_app` o `universidad-dev_app`), sin red `default`. Solo el frontend añade `proxy`; la API y la base nunca se conectan a ella. `app` no usa `internal: true`: el backend necesita salida a las fuentes TDWG.

Ambos manifiestos usan una red **externa** compartida, incluso sin activar el perfil: el operador debe crearla una vez si no existe (`docker network create proxy`, o el nombre de `TRAEFIK_NETWORK`). El default es `proxy`; un `TRAEFIK_NETWORK` configurado previamente, incluido el nombre antiguo, lo sobrescribe. Revisarlo manualmente si se desea adoptar el nuevo default; las plantillas permanecen intactas. Un Traefik existente debe estar conectado a esa red, tener proveedor Docker, el entrypoint HTTPS indicado y el resolver `le` configurado. No arrancar el incluido si otro proxy ocupa el puerto.

```bash
# Producción, con Traefik existente:
docker compose --env-file .env -f compose.yml up --build -d --wait
# Producción, ejecutando también el Traefik incluido:
docker compose --env-file .env -f compose.yml --profile local-traefik up --build -d --wait
# Desarrollo, con Traefik incluido (omitir el perfil para uno existente):
docker compose --env-file .env.dev -f compose.dev.yml --profile local-traefik up --build -d --wait
```

El router usa **HTTPS**, entrypoint `${TRAEFIK_ENTRYPOINT:-websecure}` y resolver fijo `le`. El proxy incluido usa Traefik **v3.7**, `restart: unless-stopped`, redirección HTTP → HTTPS y HTTP-01 en `web`. Publica `127.0.0.1:80:80` y `127.0.0.1:443:443`, sin dashboard; conserva certificados en el volumen `certificates` propio del proyecto. No fija `container_name`, para evitar colisiones entre proyectos. El correo ACME predeterminado es el placeholder `example@email.com` (reemplazarlo por un contacto real antes de solicitar certificados), sustituible con `TRAEFIK_ACME_EMAIL`.

**Certificados reales no garantizados en local:** Let's Encrypt no emite para `localhost`; HTTP-01 requiere un dominio público y acceso entrante al puerto 80. El bind local se conserva deliberadamente: este MVP sin autenticación no queda autorizado para Internet. Para un dominio real hace falta infraestructura externa adecuada. No seleccionar `TRAEFIK_ENTRYPOINT=web` con el proxy incluido: `web` ya escucha HTTP en 80 y redirige al entrypoint TLS de 443. El default debe ser `websecure`, no `web`.

Se conservan los accesos HTTP directos locales (8081/4200), independientes de Traefik. Para HTTPS, ajustar el origen permitido y la URL API accesible por el navegador; un frontend HTTPS no convierte la API HTTP en HTTPS ni añade un proxy API. El router y servicio se llaman **`museum`** en ambos modos (destino 80/4200): son alternativas, no publicarlas simultáneamente en el mismo proxy sin rutas manuales distintas. `exposedbydefault=false` excluye el propio proxy; solo frontend se habilita explícitamente.

**Límite de confianza:** el proveedor Docker necesita `/var/run/docker.sock`, montado `:ro`. Esto no restringe los métodos de la API Docker: el proxy tiene acceso privilegiado al daemon. Usar únicamente en un host local confiable; no exponer el socket, el dashboard ni la API a la red.

| Variable | Default / función |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Obligatorias; `museum`, `museum` y un secreto propio, nunca el placeholder |
| `DB_PORT`, `SERVER_PORT` | Defaults 5432 y 8080; DB interna fija `museum-db:5432`, API usa `SERVER_PORT` tanto dentro como fuera del contenedor y en el healthcheck |
| `FRONTEND_PORT`, `FRONTEND_HTTP_PORT` | 4200 para CLI y 8081 para Nginx |
| `TRAEFIK_HOST`, `TRAEFIK_ENTRYPOINT` | `localhost`, `websecure`; un valor explícito prevalece (no usar `web` con el proxy incluido) |
| `TRAEFIK_ACME_EMAIL` | `example@email.com`; contacto ACME del proxy incluido |
| `TRAEFIK_NETWORK` | `proxy`, externa y preexistente; un valor explícito prevalece |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200,http://127.0.0.1:4200,http://localhost:8081,http://127.0.0.1:8081,http://localhost,http://127.0.0.1`; lista separada por comas para Spring MVC |

No se leen ni modifican los dotenv reales ni las plantillas para verificar estos contratos. El resolver `le` es fijo en las etiquetas frontend y en los comandos del proxy incluido; cualquier ajuste antiguo del nombre de resolver deja de tener efecto.

### URL pública y CORS

La URL del backend se configura mediante **application environments de Angular**, no mediante variables del proceso ni dotenv:

| Archivo | Modo |
|---|---|
| `frontend/src/environments/environment.ts` | Normal / `production`, usado por `npm run build` y la imagen compilada |
| `frontend/src/environments/environment.development.ts` | Desarrollo, usado por `npm start`, `npm run watch` y build con `--configuration development` |

Ambos exportan `baseUrl: 'http://localhost:8080/api'`. Editar el archivo del modo deseado: `angular.json` selecciona el de desarrollo con `fileReplacements`. La URL debe ser accesible desde el navegador, no `http://backend:8080`; nunca incluir secretos. HttpClient usa esa base y Query conserva la caché de metadatos y la cancelación. Cambiarla exige recompilar; en producción Docker, reconstruir la imagen y recrear el contenedor. Una variable del contenedor ya compilado no modifica el bundle. Ver [configuración frontend](frontend/README.md#url-pública-de-la-api).

No hay JSON runtime, generador ni proxy API. Nginx usa la configuración estática `frontend/nginx.conf`, con fallback SPA a `index.html` para las rutas `/analisis`, `/fuentes-de-registros` y `/catalogo`; no proxifica la API.

El backend obtiene `CORS_ALLOWED_ORIGINS` mediante el entorno explícito de Compose, resuelto desde shell o `--env-file` (precedencia normal del shell); sin definir usa el default de `application.yaml`, no una segunda lista en Compose. La lista contiene orígenes exactos (sin `/api`), sin wildcard ni credenciales. CORS no autentica usuarios ni oculta la API a clientes no navegador.

Ejemplo de valores para gestionar manualmente en `.env.dev` (cambia también el puerto interno de la API, no el de PostgreSQL):

```text
DB_PORT=15432
SERVER_PORT=18080
FRONTEND_PORT=14200
CORS_ALLOWED_ORIGINS=http://localhost:14200,http://127.0.0.1:14200
```

Para ese ejemplo, configurar además `baseUrl: 'http://localhost:18080/api'` en `frontend/src/environments/environment.development.ts`. Para producción, editar el archivo normal y reconstruir la imagen frontend. En ese ejemplo, los puertos internos son 18080 para la API y 5432 para PostgreSQL.

Si se abre la página mediante un `TRAEFIK_HOST` personalizado, incluir también ese origen real (esquema y puerto público) en CORS. Cambiar CORS requiere recrear el backend: un simple `restart` no actualiza el entorno de un contenedor existente. Las plantillas y los dotenv permanecen intactos durante esta implementación.

## Análisis de un archivo

1. Seleccionar un CSV o XLSX y, cuando corresponda, su hoja. La primera fila contiene los encabezados y las siguientes los registros. Hay ejemplos en `examples/`.
2. En **Contexto**, elegir una sola opción: colección biológica, permiso de recolección o acceso a recursos genéticos, eventos de muestreo, marinos u otros. Separar archivos cuyos registros necesiten contextos distintos. No hay selección de perfiles.
3. Confirmar el mapeo de columnas: primero las que contienen datos y después las totalmente vacías bajo «Campos sin datos». Las sugerencias Darwin Core no se aplican automáticamente. Se permite llegar al mapeo aunque falten encabezados, para poder reconocer equivalencias antes del diagnóstico. Pulsar **Validar localmente**.
4. Revisar el **Diagnóstico**: resumen compacto de campos obligatorios sin datos. Abrir un conteo muestra filas originales y valores; campo y columna de origen se indican una sola vez. **Ver todas las incidencias** permite consultar el detalle completo filtrable, sin añadir otro detalle simultáneo. Las descargas incluyen todo el diagnóstico y la revisión de configuración utilizada. La ausencia de una columna se informa como tal, sin inventar celdas; las filas conservan sus números originales.
5. En **Normalizar**, revisar la copia local con **Con cambios** por defecto; **Todos** permite recorrer el conjunto completo en páginas de 10/25/50/100 filas y ventanas de hasta 50 columnas:
   - Seis reglas siempre activas, sin interruptores: recortar espacios extremos, tratar NULL/N/A como vacíos sin distinguir mayúsculas, fechas Darwin Core, coordenadas decimales, valores numéricos Darwin Core y comprobar duplicados. Los originales y el archivo no cambian.
   - **Formatos y reglas** empieza plegado. Fechas y decimales usan modo seguro; DMY/MDY y coma decimal requieren elección explícita. Los identificadores conservan ceros y mayúsculas, sin conversión por apariencia numérica.
   - Duplicados avisa sobre todos los registros por filas completas iguales y por `occurrenceID` no vacío repetido, sin borrar ni convertir esos avisos en cambios de valor. **Ocultar columnas sin datos** y los filtros solo cambian la vista; una fila modificada en una columna oculta sigue en Con cambios.
   - El detalle antes/después se abre al pasar el ratón, enfocar o tocar; Escape lo cierra. La tabla muestra valores literales; las marcas de espacios quedan en el detalle del original.
   - **Aplicar normalización y validar** sigue siendo explícito y permanece en Normalizar. Cambiar formatos o vistas no valida automáticamente; el primer diagnóstico usa originales. [Reglas y límites de normalización](frontend/NORMALIZATION.md).
6. **Finalizar** queda vacío por ahora; no guarda ni envía registros.

El análisis se ejecuta en un Web Worker. La API recibe únicamente metadatos de configuración y catálogo; **no se envían nombres de archivo, celdas, filas ni contenido biológico**. Una importación futura deberá ser una operación separada, expresamente autorizada y validada nuevamente por el servidor.

### Idioma y conservación de datos

La interfaz, las ayudas y los diagnósticos del sistema se presentan en español. Los nombres oficiales Darwin Core, las URI, los identificadores técnicos, las claves y los valores de contratos de API permanecen sin cambios. Los datos de los archivos y los textos escritos por usuarios no se traducen. Normalizar prepara una copia con las seis reglas fijas descritas arriba; solo Aplicar actualiza el diagnóstico, sin modificar los originales. Las definiciones oficiales del catálogo se conservan como citas de la fuente original, con su idioma indicado. El retiro definitivo de perfiles se aplica mediante la migración autorizada descrita abajo; no modifica los archivos originales ni traduce contenido del usuario.

## Configuración global de validación

En **Fuentes de registros biológicos** se administran los campos obligatorios y opcionales de los cinco tipos de fuente. El administrador muestra selección maestro–detalle, recuentos reales y búsqueda local; agregar campos reutiliza el selector DwC. El botón de estado junto a Quitar alterna Obligatorio/Opcional: el campo permanece visible y guardado. Quitar lo retira de la configuración de esa fuente, no del vocabulario. Solo los obligatorios generan incidencias por ausencia; las comprobaciones básicas de fechas y coordenadas siguen activas. El análisis conserva el paso **Contexto**. Los cambios locales son un borrador hasta guardar; no hay perfiles seleccionables, duplicación ni ciclos de publicación. Los cambios se guardan en PostgreSQL y se aplican a los análisis posteriores; una revisión obsoleta se rechaza sin sobrescribir el trabajo de otro editor. Si cambia la configuración durante un análisis abierto, el diagnóstico anterior se invalida y debe ejecutarse de nuevo.

La configuración inicial responde al pedido del museo y a la matriz SiB suministrada:

| Contexto | Campos obligatorios iniciales |
|---|---:|
| Colección biológica | 30 |
| Permiso de recolección o acceso a recursos genéticos | 22 |
| Eventos de muestreo | 10 |
| Marinos | 15 |
| Otros | 8 |

`disposition` empieza opcional en colección y obligatorio en permisos. En permisos se siguen literalmente las marcas de la matriz para `individualCount`, `organismQuantity` y `organismQuantityType`; no se convierten en una alternativa ni se arrastran advertencias de perfiles anteriores. Las comprobaciones básicas de fechas y coordenadas siguen verificando los valores no vacíos. Esta configuración local no es una certificación SiB.

Los endpoints activos son `GET /api/validation-configuration` y `PUT /api/validation-configuration`. La escritura incluye la revisión vigente y la configuración de los cinco contextos. Las rutas `/api/profiles` se retiran. Las migraciones V1/V2 ya aplicadas no se reescriben; V4 elimina de forma irreversible la tabla de perfiles antiguos, su trigger y su función dedicada, por decisión expresa del usuario. Se conservan el catálogo, la configuración global y el historial de Flyway. El borrado se aplica a cada base que ejecute esa migración, no mediante una limpieza manual ni eliminando volúmenes. No se envían archivos ni celdas al guardar ajustes. Más información: [API del backend](backend/README.md) y [arquitectura del frontend](frontend/README.md).

## Catálogo y evidencia SiB

La copia inicial contiene **414 entradas TDWG**, incluidos términos Dublin Core e históricos u obsoletos. La fuente oficial es https://dwc.tdwg.org/terms/ y los CSV mantenidos por TDWG. Cada entrada conserva nombre, URI canónica, definición y categoría oficiales; `current`/`deprecated` proyecta la marca oficial de obsolescencia. Las categorías ausentes permanecen vacías, sin inferirlas del tipo RDF. **Pertenecer al vocabulario no implica obligatoriedad:** los campos obligatorios dependen de la configuración global del contexto elegido.

El backend intenta sincronizar el catálogo automáticamente cada día, con una primera ejecución 60 segundos después del arranque. Descarga las tres fuentes fijadas al mismo commit y activa una instantánea completa en PostgreSQL solo después de validarla. Si falla la descarga o validación, conserva la última versión válida, también tras reiniciar. No marca como obsoleto un término solo porque desaparezca: rechaza ese candidato incompleto. `GET /api/catalog/status` permite consultar revisión, fecha, conteos y último fallo; la configuración y los límites se describen en [backend/README.md](backend/README.md).

En Catálogo, **«Sincronizar con TDWG»** dispara una actualización manual mediante `POST /api/catalog/sync`, sin cuerpo. Muestra actividad mientras espera y distingue éxito confirmado, fallo conservando la última versión válida e intento reemplazado por uno posterior. Al terminar actualiza la caché compartida; no envía archivos ni modifica la configuración de validación. La sincronización diaria sigue habilitada.

La evidencia SiB conserva la matriz del Excel oficial 4.1. La configuración activa usa los campos y la obligatoriedad del pedido actual, incluida la ampliación local a 30 campos mínimos de colección; no se atribuye esa política a TDWG.

Limitaciones importantes:

- `disposition` e `individualCount` tienen discrepancias documentadas entre fuentes históricas SiB. Los valores iniciales actuales siguen la política expresamente solicitada, descrita arriba; no se presentan como resolución científica de esas discrepancias.
- El contexto de permiso también requiere una extensión GGBN. Este MVP valida la hoja principal y no reemplaza la revisión de esa extensión.
- Un `country` desconocido genera un diagnóstico, no una autorización para inventar el país.

Las [fuentes oficiales, atribuciones y licencias](sources/README.md) están disponibles en el repositorio. Para reconstruir y verificar los datos iniciales sin conexión:

```bash
python3 scripts/build_seeds.py
python3 scripts/test_seeds.py
```

Reconstruir los recursos no sobrescribe la configuración ya guardada ni ejecuta por sí mismo el retiro de perfiles en PostgreSQL. Los requisitos activos se modifican desde Fuentes de registros biológicos con control de revisión.

## Pruebas y compilación

```bash
python3 scripts/test_seeds.py
python3 -B scripts/test_compose.py
cd frontend
npm run lint
npm test -- --watch=false
npm run build
cd ../backend
./mvnw test
./mvnw package -DskipTests
```

La auditoría de dependencias es una comprobación separada: `npm audit`. Los dos intentos descritos agotaron sus límites; no se ejecutan nuevos intentos automáticamente.

Las pruebas del backend crean contenedores PostgreSQL aislados, sin usar la base de desarrollo. Los README de cada componente detallan sus requisitos. El reemplazo actual se especifica en `odd/tasks/global-validation.md`. Los registros históricos `odd/tasks/museum-dwc.md`, `odd/tasks/museum-evolution.md`, `odd/tasks/museum-refinement.md`, `odd/tasks/frontend-architecture.md` y `odd/tasks/backend-hexagonal.md` conservan las tareas, decisiones y evidencias del módulo inicial y de sus mejoras; una compilación exitosa no sustituye las pruebas en navegador. El informe de comprobaciones y limitaciones está en [VERIFICATION.md](VERIFICATION.md).

## Arquitectura y siguiente integración

```text
Aplicación de gestión Angular / PrimeNG
 ├─ TanStack Query → metadatos REST de configuración global y catálogo
 └─ archivo local → Web Worker → parser → originales o copia normalizada explícitamente aplicada → motor de validación
                                                          └─ diagnóstico → descarga local
Spring Boot REST → configuración global transaccional → repositorio JPA → PostgreSQL
                                    revisión + bloqueo + migraciones aditivas
```

Keycloak queda como una integración posterior, no como una pantalla de acceso simulada. Antes de exponer el sistema en una red:

- Incorporar Spring Security OAuth2 Resource Server con validación de emisor, audiencia y JWT, y autorización para lectura y edición de la configuración. No confiar solo en las guardas de Angular.
- Incorporar OIDC Authorization Code con PKCE en Angular y un único límite para agregar autorización a las solicitudes de metadatos. No guardar tokens en archivos ni diagnósticos.
- Incorporar identidad de auditoría y revisar CORS, estrategia CSRF, TLS, límites y control de frecuencia para el despliegue elegido.
- Implementar la importación en un endpoint autenticado independiente: límites de archivo, tratamiento de contenido no confiable, configuración y contexto fijados, validación autoritativa en backend y persistencia transaccional. Un diagnóstico del navegador nunca debe autorizar escrituras en la base.

El MVP no ofrece carga de archivos ni almacena registros biológicos. La edición de la configuración global no tiene autenticación y debe utilizarse **solo en localhost** hasta integrar Keycloak.
