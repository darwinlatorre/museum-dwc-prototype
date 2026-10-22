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

4. Abrir http://localhost:4200. El proxy de desarrollo dirige `/api` a http://127.0.0.1:8080. Flyway crea el esquema; la primera ejecución carga el catálogo y los perfiles publicados `SiB Registros Biológicos 4.1` y `Museo 1.0`.

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
5. Indicar los contextos aplicables: depósito en colección, permiso, registros marinos y eventos de muestreo. Las condiciones corresponden al lote analizado; separar los lotes con contextos distintos.
6. Validar, filtrar las incidencias y descargar el diagnóstico. La ausencia de una columna se informa en el encabezado; los errores de registros indican la fila original, a partir de la fila 2.

El análisis se ejecuta en un Web Worker. La API recibe únicamente metadatos de perfiles y catálogo; **no se envían nombres de archivo, celdas, filas ni contenido biológico**. Una importación futura deberá ser una operación separada, expresamente autorizada y validada nuevamente por el servidor.

### Idioma y conservación de datos

La interfaz, las ayudas y los diagnósticos del sistema se presentan en español. Los nombres oficiales Darwin Core, las URI, los identificadores técnicos, las claves y los valores de contratos de API permanecen sin cambios. Los datos de los archivos y los textos escritos por usuarios no se traducen ni modifican automáticamente. Las definiciones oficiales del catálogo se conservan como citas de la fuente original, con su idioma indicado. La traducción de los mensajes predeterminados no debe reescribir versiones publicadas.

## Administración de perfiles

La sección de perfiles permite crear un borrador, agregar reglas, guardar cambios, duplicar una versión y publicarla. El nombre y la versión identifican una combinación única. Una versión publicada es inmutable: para cambiar sus reglas se crea otra versión. Las ediciones de borradores desactualizados se rechazan, sin sobrescribir cambios de otro editor.

Las reglas son declarativas y limitadas, no código JavaScript ejecutable. Cada una indica campo, comprobación, severidad, condición de contexto, mensaje y fuente. Más información: [API del backend](backend/README.md) y [arquitectura del frontend](frontend/README.md).

## Catálogo y evidencia SiB

El catálogo fijado contiene **414 entradas TDWG**, incluidos términos Dublin Core e históricos u obsoletos. Cada entrada conserva nombre, URI canónica, definición oficial, categoría y estado. **Pertenecer al vocabulario no implica obligatoriedad:** los campos obligatorios dependen de cada perfil.

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

Las pruebas del backend crean contenedores PostgreSQL aislados, sin usar la base de desarrollo. Los README de cada componente detallan sus requisitos. El registro `odd/tasks/museum-dwc.md` conserva tareas, decisiones y evidencia; una compilación exitosa no sustituye las pruebas en navegador. El informe de comprobaciones y limitaciones está en [VERIFICATION.md](VERIFICATION.md).

## Arquitectura y siguiente integración

```text
Aplicación de gestión Angular / PrimeNG
 ├─ TanStack Query → metadatos REST de perfiles y catálogo
 └─ archivo local → Web Worker → parser → normalizador optativo → motor de validación
                                                          └─ diagnóstico → descarga local
Spring Boot REST → servicio transaccional de perfiles → PostgreSQL
                                    Flyway + protección de versiones publicadas
```

Keycloak queda como una integración posterior, no como una pantalla de acceso simulada. Antes de exponer el sistema en una red:

- Incorporar Spring Security OAuth2 Resource Server con validación de emisor, audiencia y JWT, y autorización para lectura, edición y publicación. No confiar solo en las guardas de Angular.
- Incorporar OIDC Authorization Code con PKCE en Angular y un único límite para agregar autorización a las solicitudes de metadatos. No guardar tokens en archivos ni diagnósticos.
- Incorporar identidad de auditoría y revisar CORS, estrategia CSRF, TLS, límites y control de frecuencia para el despliegue elegido.
- Implementar la importación en un endpoint autenticado independiente: límites de archivo, tratamiento de contenido no confiable, perfiles fijados, validación autoritativa en backend y persistencia transaccional. Un diagnóstico del navegador nunca debe autorizar escrituras en la base.

El MVP no ofrece carga de archivos ni almacena registros biológicos. La administración de perfiles no tiene autenticación y debe utilizarse **solo en localhost** hasta integrar Keycloak.
