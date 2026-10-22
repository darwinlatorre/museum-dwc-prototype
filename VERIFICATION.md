# Evidencia de verificación del MVP

La entrega funcional fue aceptada explícitamente con la auditoría de dependencias pendiente: **«Si acepto.»**. Esa aceptación no transforma un timeout en una auditoría aprobada ni autoriza reintentos. La traducción posterior al español se registra como trabajo adicional, con comprobaciones propias al final de este documento.

No se afirma aprobación de revisión nativa, publicación remota ni despliegue de producción.

## Comprobaciones observadas

| Comprobación | Resultado |
|---|---|
| Datos iniciales sin conexión | 3/3 aprobadas; el RED inicial correspondió a recursos todavía inexistentes |
| API pública sobre PostgreSQL aislado | 20/20 aprobadas antes de traducir; la suite posterior de idioma tiene 21/21 aprobadas; paquete Maven correcto |
| Verificación independiente del backend | Las nueve pruebas originales aprobaron; pruebas HTTP adicionales detectaron dos fallos de validación de entradas |
| Rechequeo acotado de correcciones | 11/11 aprobadas en PostgreSQL nuevo: enumerados numéricos y cuerpos de publicación no vacíos se rechazan sin escrituras; publicación sin cuerpo aprobada |
| Frontend previo a la traducción | 49/49 aprobadas por el padre y el verificador independiente |
| Frontend en español | 56/56 aprobadas por el worker y por el padre; compilación de producción aprobada |
| Tamaño del frontend en español | 633,88 kB iniciales: advertencia sobre el objetivo de 500 kB, por debajo del límite de error sin modificar de 1 MB |
| Coherencia de dependencias tras migración MIT | El verificador confirmó las 21 dependencias directas, sus versiones instaladas/lock y compatibilidad; Angular 21.2.25, build 21.2.27, CDK 21.2.14, PrimeNG 21.1.10, temas 2.0.3, TypeScript 5.9.3 y Vitest 4.1.12 |
| Auditoría de dependencias | No disponible: primer intento agotado a los 120 s; `timeout 300s npm audit --json`, autorizado expresamente, terminó con código 124 a los 5 minutos sin salida. Sin reintento ni afirmación de limpieza |
| Instalación de dependencias | La instalación original agotó 120 s. La migración MIT autorizada terminó correctamente en 21 s con `npm install --no-audit --no-fund` bajo límite de 300 s. `npm ls --all` terminó con código 0. No se ejecutó después un `npm ci` nuevo |
| Evaluación de revisión nativa | No evaluable: el proveedor solicitó declarar los archivos originales restantes sin seguimiento. No se inició una revisión ni se afirmó aprobación o reconocimiento |

Hubo advertencias no fatales de metadatos Maven con respuesta 401, agente dinámico Mockito y API obsoletas. Testcontainers utilizó bases desechables; no se cambió la base existente del proyecto. La base de desarrollo del MVP usa el servicio separado `museum-db` y el puerto 55432. Los archivos locales de entorno no se modificaron.

## Recorridos iniciales en navegador

Se usó Chrome for Testing 156 oficial, descargado con autorización humana en `.browser/`, excluido de Git, y la sesión nombrada `museum-01a16167` de agent-browser.

1. **CSV con errores:** `examples/records-with-errors.csv`, ambos perfiles iniciales publicados y contextos predeterminados. El worker generó 29 errores y una advertencia por columna desconocida. Se conservaron el origen de cada perfil y las filas: `scientificName` vacío en fila 3, `eventDate` inválido en fila 2 y coordenadas fuera de rango en filas 2/3.
2. **Descargas:** los botones JSON y CSV guardaron archivos reales. Ambos contenían 30 incidencias con campo, fila original, descripción, severidad, perfil y versión.
3. **Análisis local:** el registro HAR durante lectura y validación del CSV contiene únicamente dos GET del módulo worker, sin POST ni cuerpo de solicitud. Es evidencia de ese recorrido observado, no una garantía automática sobre cambios futuros.
4. **XLSX:** `examples/records.xlsx` mostró ambas hojas. La hoja `Complete`, elegida mediante teclado, produjo cero incidencias con ambos perfiles. `With errors` produjo el diagnóstico de registros inválidos equivalente al CSV. Los nombres pertenecen a datos de ejemplo y se conservaron.
5. **Perfiles configurables:** se creó mediante la interfaz `Browser acceptance profile` 1.0 con una regla condicional sobre `catalogNumber`; se publicó con confirmación, se duplicó como 1.1 y se editó el borrador. El GET público confirmó que 1.0 seguía publicado con revisión 1 y descripción original; 1.1 era borrador con revisión 1 y nueva descripción. Las reglas eran independientes y equivalentes.
6. **Catálogo:** se comprobaron nombre, URI canónica, definición oficial, categoría y estados vigente/obsoleto.
7. No se observaron errores de navegador en los recorridos CSV/XLSX inspeccionados. Inicialmente se veía un aviso del proveedor por la licencia; no se ocultó ni desactivó, sino que posteriormente se migró a dependencias MIT.

## Fallos registrados y limitaciones

- La prueba de la interfaz principal entregada inicialmente no activaba el contenido diferido. Se reprodujo el fallo y se corrigió su sincronización usando metadatos Query precargados y el estado diferido explícito de Angular. Se conservaron todas las aserciones.
- Una espera de XLSX sin incidencias agotó 30 s porque `select` de agent-browser cambió el valor DOM sin actualizar el campo Angular: `dom=Complete`, `model=With errors`. La selección real con teclado actualizó el modelo y el recorrido corregido aprobó. No se modificó la aplicación para ocultar una deficiencia de automatización.
- Un intento de descarga con un selector textual no admitido por la herramienta no encontró el elemento. La descarga mediante la referencia actual del botón sí guardó el archivo. No fue un fallo de exportación de la aplicación.
- PrimeNG 22 exigía clave y mostraba `Invalid PrimeUI License`. El usuario autorizó migrar. Los archivos de licencia reales de PrimeNG 21.1.10 comunitario y temas 2.0.3 otorgan MIT; se verificaron independientemente las licencias, dependencias y lock. No se inyectaron claves ni se alteró código del proveedor.
- Los formularios basados en señales de Angular 21 son experimentales. Su API compatible conserva el bloqueo de perfiles publicados.
- XLSX se descomprime antes de comprobar los límites de filas/columnas; 10 MiB de archivo comprimido no garantizan un límite equivalente de memoria.
- Keycloak, importación y validación de registros biológicos en backend, y extensión GGBN no están implementados; el MVP debe usarse exclusivamente en localhost.
- La auditoría no produjo resultados dentro de los dos límites descritos. El usuario aceptó esta evidencia no disponible; no se declaró que existieran o no vulnerabilidades.

## Conservación del comportamiento al migrar a MIT

El conjunto compatible está fijado en `package.json` y su lockfile. Query 5.104.5 y `read-excel-file` 9.3.12 no cambiaron. La única adaptación de producción cambió la sintaxis de la función `disabled` de Angular; el predicado de bloqueo y la protección al guardar permanecieron iguales.

Se reprodujo el fallo de metadatos sin resolver de Angular 21 y se agregó `await TestBed.compileComponents()` sin quitar aserciones. El padre y el verificador aprobaron 49/49 pruebas; la compilación de producción fue correcta. El verificador también comprobó el estado deshabilitado en perfiles publicados y habilitado en duplicados, borradores y perfiles nuevos.

En navegador, después de migrar:

- El CSV generó los mismos 30 objetos JSON, **idénticos en contenido y orden** a la descarga anterior.
- La hoja XLSX `Complete` siguió sin incidencias con ambos perfiles.
- Los metadatos y campos de reglas de publicaciones estaban deshabilitados y no había acción de guardado.
- Captura y DOM confirmaron la ausencia del aviso de licencia, sin modificar código del proveedor.

## Traducción al español: evidencia específica

Alcance elegido por el usuario: **«Interfaz, diagnósticos y documentación — recomendado»**. Se mantienen identificadores técnicos, nombres Darwin Core, URI y contratos de API. Los archivos de origen, citas TDWG y contenido arbitrario de los usuarios no se alteran.

### Backend

- RED observado: el título HTTP esperado `Solicitud incorrecta` era `Bad Request`.
- GREEN focalizado: una prueba pública aprobada comprueba títulos y detalles españoles para errores 400/404/409/405, encabezado `Allow` y el listado completo de perfiles sin modificaciones tras rechazos.
- Suite completa: **21 pruebas aprobadas**, cero fallos/errores/omisiones; paquete ejecutable aprobado.
- La traducción usa el tratamiento de excepciones de Spring y conserva encabezados, estado, instancia y claves técnicas. No se cambió la migración Flyway V1 ni los datos publicados.

### Frontend

- El worker observó cuatro fallos esperados al añadir las aserciones de español y luego **56/56 aprobadas**. Se conservan las pruebas anteriores y se comprueban objetos originales intactos, enumerados, claves JSON y publicación sin cuerpo.
- El padre observó **56/56 aprobadas** y compilación correcta. La localización de mensajes iniciales es solo de presentación, acotada a los perfiles oficiales conocidos por identidad y versión; una duplicación conserva los textos originales como datos.
- Chromium comprobó el asistente completo en español: CSV con 29 errores y una advertencia, descargas JSON/CSV de 30 incidencias, y hoja XLSX válida sin incidencias. Las filas, campos, enumerados y claves JSON coinciden con el diagnóstico anterior; solo se tradujeron los textos y la etiqueta del sistema.
- El HAR del análisis español contiene dos GET del worker, sin POST ni cuerpo de solicitud. El GET de perfiles permaneció idéntico tras consultar y analizar: la localización no reescribió las cuatro versiones previas.
- En la interfaz española se creó `Perfil de comprobación en español` 1.0, se editó su descripción, se publicó con confirmación española y se duplicó como 1.1. El GET público confirmó 1.0 publicado/revisión2, 1.1 borrador/revisión0, reglas y textos españoles conservados, identificadores independientes y cuatro perfiles previos intactos. Los campos publicados estaban deshabilitados y no se observaron errores del navegador.
- Los títulos, navegación, paginación, etiquetas de estado/condición/severidad y ayudas se observaron en español. Los nombres de hojas y datos arbitrarios de usuarios permanecen originales. Las cadenas propias del navegador o de controles internos de terceros pueden depender del idioma del entorno y no se alteró código del proveedor.

### Incidente del servidor de desarrollo

Una solicitud de referencia al servidor local antiguo agotó su límite de 5 segundos y se registró como fallo, sin reintentar. El diagnóstico separado encontró PostgreSQL saludable y el proceso Java antiguo todavía escuchando en 8080, pero con `NoClassDefFoundError` de Logback en su registro. Su JAR había permanecido en ejecución mientras se reconstruía el mismo archivo. No se identificó un fallo de traducción ni de base de datos.

El usuario autorizó explícitamente «Sí, actualizar el proceso y completar la comprobación». Se detuvo únicamente el proceso Java local antiguo y se inició la versión española desde `backend/target/runtime-es/museo-es.jar`, una copia distinta del artefacto reconstruible. No se borraron datos ni se ejecutó otra auditoría. La espera acotada de disponibilidad terminó correctamente con GET200; posteriormente la API real devolvió errores400/409/404/405 en español, conservó `Allow` con GET/POST y dejó intactos los perfiles frente a los rechazos. El recorrido español posterior se completó correctamente.

Al reabrir la automatización, la sesión de Chrome había expirado y su lanzamiento sin ruta explícita no encontró un navegador. Se volvió a indicar la ruta ya autorizada de `.browser/chrome-headless-shell-linux64/chrome-headless-shell`, sin descargar otro navegador ni cambiar la aplicación. Las comprobaciones reales siguientes utilizaron ese ejecutable.

Las capturas, descargas y HAR permanecen en `.browser/`, excluido de Git. Los perfiles de aceptación permanecen visibles en la base aislada; no se eliminó historial publicado como limpieza.
