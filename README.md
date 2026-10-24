# Gestión y validación de registros biológicos del museo

Primer módulo para el Museo de Historia Natural de la Universidad del Cauca. Permite analizar archivos CSV/XLSX **en el navegador**, contrastarlos con perfiles independientes de SiB y del museo, descargar diagnósticos y administrar borradores sin modificar el código.

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

3. Abrir http://localhost:4200. Nginx sirve Angular y dirige `/api/` al backend conservando el prefijo. Flyway crea el esquema; la primera ejecución carga el catálogo y los perfiles publicados `SiB Registros Biológicos 4.1`, `Museo 1.0` y `Museo + SiB 1.0`.

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
2. Elegir uno o varios perfiles **publicados**. Los borradores no se utilizan para diagnósticos reproducibles.
3. Confirmar el mapeo de columnas. Las sugerencias Darwin Core no se aplican automáticamente.
4. Elegir la normalización y revisar su vista previa. Los valores originales del archivo no cambian.
5. Indicar los contextos aplicables: asociados a un permiso de recolección o acceso a recursos genéticos, colección biológica, eventos de muestreo y marinos. Los cuatro son combinables. «Otros: observaciones en campo, registros fortuitos u otros orígenes no contemplados» desmarca los cuatro; seleccionar cualquiera de ellos desmarca «Otros». Las condiciones corresponden al lote analizado; separar los lotes con contextos distintos.
6. Validar, filtrar las incidencias y descargar el diagnóstico. La ausencia de una columna se informa en el encabezado; los errores de registros indican la fila original, a partir de la fila 2.

El análisis se ejecuta en un Web Worker. La API recibe únicamente metadatos de perfiles y catálogo; **no se envían nombres de archivo, celdas, filas ni contenido biológico**. Una importación futura deberá ser una operación separada, expresamente autorizada y validada nuevamente por el servidor.

### Idioma y conservación de datos

La interfaz, las ayudas y los diagnósticos del sistema se presentan en español. Los nombres oficiales Darwin Core, las URI, los identificadores técnicos, las claves y los valores de contratos de API permanecen sin cambios. Los datos de los archivos y los textos escritos por usuarios no se traducen ni modifican automáticamente. Las definiciones oficiales del catálogo se conservan como citas de la fuente original, con su idioma indicado. La traducción de los mensajes predeterminados no debe reescribir versiones publicadas.

## Administración de perfiles

La sección de perfiles abre un diálogo para crear o revisar una versión, con datos del perfil y reglas agrupadas. El selector Darwin Core es el mismo control PrimeNG con búsqueda utilizado al mapear columnas. Se puede crear un borrador, agregar reglas, guardar cambios, duplicar una versión y publicarla. El nombre y la versión identifican una combinación única. Una versión publicada es inmutable: para cambiar sus reglas se crea otra versión. Las ediciones de borradores desactualizados se rechazan, sin sobrescribir cambios de otro editor.

El perfil **Museo + SiB 1.0** reúne los requisitos de ambos: 56 reglas distintas y 28 campos obligatorios siempre, conservando las condiciones y advertencias SiB. Se puede elegir solo ese perfil para comprobar ambos conjuntos; no hace falta seleccionar además sus dos originales. Es una composición local, no un perfil oficial ni una certificación SiB. Las versiones originales permanecen intactas.

Las reglas son declarativas y limitadas, no código JavaScript ejecutable. Cada una indica campo, comprobación, severidad, condición de contexto, mensaje y fuente. Más información: [API del backend](backend/README.md) y [arquitectura del frontend](frontend/README.md).

## Catálogo y evidencia SiB

La copia inicial contiene **414 entradas TDWG**, incluidos términos Dublin Core e históricos u obsoletos. La fuente oficial es https://dwc.tdwg.org/terms/ y los CSV mantenidos por TDWG. Cada entrada conserva nombre, URI canónica, definición y categoría oficiales; `current`/`deprecated` proyecta la marca oficial de obsolescencia. Las categorías ausentes permanecen vacías, sin inferirlas del tipo RDF. **Pertenecer al vocabulario no implica obligatoriedad:** los campos obligatorios dependen de cada perfil.

El backend intenta sincronizar el catálogo automáticamente cada día, con una primera ejecución 60 segundos después del arranque. Descarga las tres fuentes fijadas al mismo commit y activa una instantánea completa en PostgreSQL solo después de validarla. Si falla la descarga o validación, conserva la última versión válida, también tras reiniciar. No marca como obsoleto un término solo porque desaparezca: rechaza ese candidato incompleto. `GET /api/catalog/status` permite consultar revisión, fecha, conteos y último fallo; la configuración y los límites se describen en [backend/README.md](backend/README.md).

En Catálogo, **«Sincronizar con TDWG»** dispara una actualización manual mediante `POST /api/catalog/sync`, sin cuerpo. Muestra actividad mientras espera y distingue éxito confirmado, fallo conservando la última versión válida e intento reemplazado por uno posterior. Al terminar actualiza la caché compartida; no envía archivos ni modifica perfiles. La sincronización diaria sigue habilitada.

Las reglas SiB se contrastaron con la matriz de instrucciones del Excel oficial 4.1, no solo con los doce campos candidatos. Los 22 campos obligatorios del perfil Museo 1.0 corresponden al requerimiento independiente del museo.

Limitaciones importantes:

- `disposition` e `individualCount` presentan discrepancias entre instrucciones, definiciones e historial. Están documentadas y producen advertencias cuando un rechazo incondicional no estaría justificado.
- El contexto de permiso también requiere una extensión GGBN. Este MVP valida la hoja principal y no reemplaza la revisión de esa extensión.
- Un `country` desconocido genera un diagnóstico, no una autorización para inventar el país.

Las [fuentes oficiales, atribuciones y licencias](sources/README.md) están disponibles en el repositorio. Para reconstruir y verificar los datos iniciales sin conexión:

```bash
python3 scripts/build_seeds.py
python3 scripts/test_seeds.py
```

Reconstruir los recursos no modifica las versiones publicadas en PostgreSQL. Un cambio de requisitos debe publicarse como una nueva versión.

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

Las pruebas del backend crean contenedores PostgreSQL aislados, sin usar la base de desarrollo. Los README de cada componente detallan sus requisitos. Los registros `odd/tasks/museum-dwc.md`, `odd/tasks/museum-evolution.md`, `odd/tasks/museum-refinement.md`, `odd/tasks/frontend-architecture.md` y `odd/tasks/backend-hexagonal.md` conservan las tareas, decisiones y evidencias del módulo inicial y de sus mejoras; una compilación exitosa no sustituye las pruebas en navegador. El informe de comprobaciones y limitaciones está en [VERIFICATION.md](VERIFICATION.md).

## Arquitectura y siguiente integración

```text
Aplicación de gestión Angular / PrimeNG
 ├─ TanStack Query → metadatos REST de perfiles y catálogo
 └─ archivo local → Web Worker → parser → normalizador optativo → motor de validación
                                                          └─ diagnóstico → descarga local
Spring Boot REST → servicio transaccional → repositorio JPA / entidad de perfil → PostgreSQL
                                    Flyway + protección de versiones publicadas
```

Keycloak queda como una integración posterior, no como una pantalla de acceso simulada. Antes de exponer el sistema en una red:

- Incorporar Spring Security OAuth2 Resource Server con validación de emisor, audiencia y JWT, y autorización para lectura, edición y publicación. No confiar solo en las guardas de Angular.
- Incorporar OIDC Authorization Code con PKCE en Angular y un único límite para agregar autorización a las solicitudes de metadatos. No guardar tokens en archivos ni diagnósticos.
- Incorporar identidad de auditoría y revisar CORS, estrategia CSRF, TLS, límites y control de frecuencia para el despliegue elegido.
- Implementar la importación en un endpoint autenticado independiente: límites de archivo, tratamiento de contenido no confiable, perfiles fijados, validación autoritativa en backend y persistencia transaccional. Un diagnóstico del navegador nunca debe autorizar escrituras en la base.

El MVP no ofrece carga de archivos ni almacena registros biológicos. La administración de perfiles no tiene autenticación y debe utilizarse **solo en localhost** hasta integrar Keycloak.
