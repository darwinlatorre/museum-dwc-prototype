# Gestión y validación de registros biológicos del museo

Primer módulo para el Museo de Historia Natural de la Universidad del Cauca. Permite analizar archivos CSV/XLSX **en el navegador**, validarlos según una configuración global editable por contexto y descargar diagnósticos sin enviar registros biológicos al servidor.

**MVP de desarrollo, no despliegue de producción.** La autenticación y la importación de registros al servidor no están habilitadas. Ambos servidores deben permanecer en la interfaz local. La aplicación no certifica la publicación ante SiB, la taxonomía, los permisos ni las extensiones GGBN.

**Licencias de interfaz:** PrimeNG **21.1.10, edición comunitaria MIT**, temas PrimeUI **2.0.3** y Angular **21.2.25** (CLI/build **21.2.27**). No se utilizan versiones comerciales/LTS ni se requiere una clave PrimeUI. La migración desde la versión 22 fue autorizada; no se ocultaron avisos ni se alteraron mecanismos de licencia. Conservar las licencias incluidas en las dependencias al redistribuir.

**Auditoría pendiente aceptada:** el primer intento agotó 120 segundos. El único intento adicional autorizado, `timeout 300s npm audit --json`, terminó con código 124 tras cinco minutos sin salida. El usuario aceptó explícitamente entregar con esa comprobación pendiente: «Si acepto.». No se afirma que la auditoría haya aprobado ni que las dependencias estén libres de vulnerabilidades. Evidencia: [VERIFICATION.md](VERIFICATION.md).

## Ejecución local

Requisitos del host: Bash, Node.js **24**, npm, Java **21** y Docker con Compose que admita `up --wait --wait-timeout`. Se incluye Maven Wrapper. La instalación de dependencias, el wrapper y las imágenes requieren acceso a Internet; no se agregan plugins ni se cambian versiones.

1. Gestionar manualmente un único `.env` en la raíz. La plantilla `.env.example` es responsabilidad del humano: la excepción en `.gitignore` permite versionarla después de revisarla y sanitizarla; esto **no implica que ya esté publicada**. Completar `DB_NAME`, `DB_USER` y `DB_PASSWORD` con valores no vacíos. Las otras variables son `DB_HOST=localhost`, `DB_PORT=5432` y `SERVER_PORT=8080`. No guardar credenciales reales en Git ni compartir la salida de `docker compose config` sin `--quiet`.
2. Ejecutar desde la raíz (o invocar su ruta absoluta desde cualquier directorio):

   ```bash
   ./start.sh
   ```

3. Abrir http://localhost:4200. Nginx sirve Angular y dirige `/api/` al backend conservando el prefijo. Flyway crea el esquema; la primera ejecución carga el catálogo y la configuración global de los cinco contextos. Los reinicios no sobrescriben ajustes guardados.

`./start.sh --help` muestra el uso sin ejecutar comandos; otros argumentos se rechazan con código 2. El script comprueba herramientas y presencia del `.env`, valida el modelo con `docker compose --env-file ... -f ... config --quiet`, ejecuta `npm ci --no-audit --no-fund` y `npm run build` en `frontend`, luego `bash ./mvnw package -DskipTests` en `backend` y finalmente `docker compose up --build -d --wait --wait-timeout 180`. Usa rutas explícitas y Compose como intérprete dotenv: no ejecuta `source`, `eval` ni un parser casero. Las variables ya exportadas en la terminal tienen la precedencia normal de Compose; evitar valores antiguos exportados.

Ante cualquier error se detiene con estado no cero, no continúa ni anuncia éxito antes de la salud de los tres servicios. La espera de salud está limitada a 180 segundos; compilaciones y descargas pueden tardar más. No revierte compilados ni elimina contenedores parcialmente iniciados: revisar el fallo antes de repetir. El empaquetado omite pruebas; no reemplaza las comprobaciones de abajo. No imprime el contenido del `.env` ni activa trazas de shell.

### Red, configuración y almacenamiento

`docker-compose.yml` es el único manifiesto principal; el antiguo `compose.mvp.yml` se retira. Publica exclusivamente `127.0.0.1`: PostgreSQL `${DB_PORT:-5432}` → 5432, API `${SERVER_PORT:-8080}` → 8080 y frontend 4200 → 80. Si 5432 está ocupado, elegir otro `DB_PORT` libre en el `.env`, **sin detener otro PostgreSQL**. El backend en contenedor siempre usa `museum-db:5432`, escucha internamente en `0.0.0.0:8080` y no consume `DB_HOST=localhost`; este último sirve para un arranque opcional en el host. La API sigue sin autenticación y no debe exponerse a otras interfaces.

Se conserva el proyecto `universidad`, servicio `museum-db` y volumen `museum_mvp_data`, cuyo nombre durable es **`universidad_museum_mvp_data`**. Nunca se reutiliza `universidad_postgres_data` ni el servicio original `postgres`. Antes de arrancar, confirmar que ese volumen MVP es el deseado: si existe, usar sus credenciales vigentes. Cambiar `DB_NAME`, `DB_USER` o `DB_PASSWORD` en dotenv **no renombra ni rota** una base ya inicializada; no borrar el volumen para resolver discrepancias. El arranque puede aplicar las migraciones existentes al volumen MVP, por lo que debe elegirse conscientemente.

Solo Compose consume el `.env` raíz y entrega la configuración al backend. Spring no carga dotenv por sí mismo. El histórico `backend/.env` deja de utilizarse, permanece ignorado y sin modificaciones; el humano puede retirarlo manualmente cuando ya no lo necesite. Para desarrollo host, exportar explícitamente las variables de conexión en la terminal, sin duplicar archivos ni ejecutar dotenv como código, y usar `bash ./mvnw spring-boot:run` desde `backend`; `DB_URL` sigue disponible como override JDBC avanzado para ese modo, no para el stack Compose.

Para detener el stack sin eliminar datos, desde la raíz:

```bash
docker compose --project-name universidad --env-file .env -f docker-compose.yml stop
```

No usar `down -v`, limpiezas de volúmenes ni rotaciones automáticas. Las imágenes runtime copian el JAR y `dist/frontend/browser` ya compilados; los contextos Docker permiten solo esos artefactos y sus configuraciones, nunca dotenv, Git o `node_modules`.

## Análisis de un archivo

1. Seleccionar un CSV o XLSX y, cuando corresponda, su hoja. La primera fila contiene los encabezados y las siguientes los registros. Hay ejemplos en `examples/`.
2. En **Contexto**, elegir una sola opción: colección biológica, permiso de recolección o acceso a recursos genéticos, eventos de muestreo, marinos u otros. Separar archivos cuyos registros necesiten contextos distintos. No hay selección de perfiles.
3. Confirmar el mapeo de columnas: primero las que contienen datos y después las totalmente vacías bajo «Campos sin datos». Las sugerencias Darwin Core no se aplican automáticamente. Se permite llegar al mapeo aunque falten encabezados, para poder reconocer equivalencias antes del diagnóstico. Pulsar **Validar localmente**.
4. Revisar el **Diagnóstico**: resumen compacto de campos obligatorios sin datos. Abrir un conteo muestra filas originales y valores; campo y columna de origen se indican una sola vez. **Ver todas las incidencias** permite consultar el detalle completo filtrable, sin añadir otro detalle simultáneo. Las descargas incluyen todo el diagnóstico y la revisión de configuración utilizada. La ausencia de una columna se informa como tal, sin inventar celdas; las filas conservan sus números originales.
5. En **Normalizar**, recorrer todos los registros mediante páginas de 10/25/50/100 filas y ventanas de hasta 50 columnas:
   - Los interruptores actualizan la copia en tiempo real; con todos apagados se recuperan los originales. El detalle antes/después se abre al pasar el ratón, enfocar o tocar; Escape lo cierra.
   - Las fechas usan modo seguro salvo elección explícita DMY/MDY; interpretar coma decimal también requiere elección explícita. Los identificadores no se convierten por apariencia numérica.
   - Duplicados avisa por filas completas iguales y por `occurrenceID` no vacío repetido, sin eliminar registros. Ocultar columnas vacías solo cambia la vista.
   - Pulsar **Aplicar normalización y validar** actualiza explícitamente el diagnóstico desde la copia; mover interruptores no lo hace. El primer diagnóstico usa los originales y el archivo nunca cambia. [Reglas y límites de normalización](frontend/NORMALIZATION.md).
6. **Finalizar** queda vacío por ahora; no guarda ni envía registros.

El análisis se ejecuta en un Web Worker. La API recibe únicamente metadatos de configuración y catálogo; **no se envían nombres de archivo, celdas, filas ni contenido biológico**. Una importación futura deberá ser una operación separada, expresamente autorizada y validada nuevamente por el servidor.

### Idioma y conservación de datos

La interfaz, las ayudas y los diagnósticos del sistema se presentan en español. Los nombres oficiales Darwin Core, las URI, los identificadores técnicos, las claves y los valores de contratos de API permanecen sin cambios. Los datos de los archivos y los textos escritos por usuarios no se traducen ni modifican automáticamente. Las definiciones oficiales del catálogo se conservan como citas de la fuente original, con su idioma indicado. El retiro definitivo de perfiles se aplica mediante la migración autorizada descrita abajo; no modifica los archivos originales ni traduce contenido del usuario.

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
python3 -B scripts/test_start.py
cd frontend
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
 └─ archivo local → Web Worker → parser → normalizador optativo → motor de validación
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
