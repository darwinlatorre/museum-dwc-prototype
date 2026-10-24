# Gestión y validación de registros biológicos del museo

Primer módulo para el Museo de Historia Natural de la Universidad del Cauca. Permite analizar archivos CSV/XLSX **en el navegador**, contrastarlos con perfiles independientes de SiB y del museo, descargar diagnósticos y administrar borradores sin modificar el código.

**MVP de desarrollo, no despliegue de producción.** La autenticación y la importación de registros al servidor no están habilitadas. Ambos servidores deben permanecer en la interfaz local. La aplicación no certifica la publicación ante SiB, la taxonomía, los permisos ni las extensiones GGBN.

**Licencias de interfaz:** PrimeNG **21.1.10, edición comunitaria MIT**, temas PrimeUI **2.0.3** y Angular **21.2.25** (CLI/build **21.2.27**). No se utilizan versiones comerciales/LTS ni se requiere una clave PrimeUI. La migración desde la versión 22 fue autorizada; no se ocultaron avisos ni se alteraron mecanismos de licencia. Conservar las licencias incluidas en las dependencias al redistribuir.

**Auditoría pendiente aceptada:** el primer intento agotó 120 segundos. El único intento adicional autorizado, `timeout 300s npm audit --json`, terminó con código 124 tras cinco minutos sin salida. El usuario aceptó explícitamente entregar con esa comprobación pendiente: «Si acepto.». No se afirma que la auditoría haya aprobado ni que las dependencias estén libres de vulnerabilidades. Evidencia: [VERIFICATION.md](VERIFICATION.md).

## Ejecución local

Requisitos: Node.js 24 o posterior, Java 21 y Docker con Compose. Se incluye Maven Wrapper; su primera ejecución requiere acceso a Internet.

1. Iniciar la base de datos aislada del MVP, sin reutilizar ni eliminar la base existente:

   ```bash
   COMPOSE_DISABLE_ENV_FILE=true docker compose -f compose.mvp.yml up -d --wait
   ```

2. En otra terminal, iniciar Spring Boot:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. En otra terminal, iniciar Angular:

   ```bash
   cd frontend
   npm ci
   npm start
   ```

4. Abrir http://localhost:4200. El proxy de desarrollo dirige `/api` a http://127.0.0.1:8080. Flyway crea el esquema; la primera ejecución carga el catálogo y los perfiles publicados `SiB Registros Biológicos 4.1`, `Museo 1.0` y `Museo + SiB 1.0`.

PostgreSQL escucha en `127.0.0.1:55432`, con base y usuario `museum` y contraseña **solo de desarrollo** `museum-local-only`. Se puede cambiar la conexión mediante `DB_URL`, `DB_USER` y `DB_PASSWORD`. No guardar secretos reales en Git. Este procedimiento no utiliza el `docker-compose.yml` original ni archivos de entorno locales. Si el sistema no permite ejecutar el wrapper directamente, usar `bash mvnw` desde `backend`.

Para detener PostgreSQL sin eliminar su volumen:

```bash
COMPOSE_DISABLE_ENV_FILE=true docker compose -f compose.mvp.yml stop
```

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
