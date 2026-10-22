# Evidencia de verificación del MVP

## Estado actual: evolución del museo, aceptación integrada

**El recorrido integrado observado funciona con `Museo + SiB` 1.0.** El padre revisó el informe, las capturas internas de escritorio/móvil y los resúmenes; contrastó directamente JSON/CSV, HAR, archivos de origen y GET públicos. Aprobó 28 incidencias equivalentes (27 errores y una advertencia), dos GET sin cuerpos, nueve perfiles y estado TDWG intactos, tres archivos originales sin cambios y ausencia de errores registrados. Las suites y builds finales del padre aprobaron: **6 semillas + 51 backend + 61 frontend = 118 pruebas**. No se modificaron fuentes de producción, perfiles, dependencias ni procesos durante el recorrido de navegador; el cierre documental no agrega una auditoría ni aprobación nativa.

### Evidencia recibida del padre, no ejecutada nuevamente aquí

| Alcance | Resultado y procedencia |
|---|---|
| T1 / S1–S7, S10, S12–S13 | Commit `5b5562e`; 61 pruebas frontend y compilación aprobadas. CRUD real previo conservó los seis perfiles originales y textos arbitrarios; publicación bloqueada y duplicado independiente. |
| T2 / S11 | Commit `043a221`; verificación independiente de JPA aprobada, incluidos rechazos equivalentes y conservación de datos. |
| T3 / S9.1–S9.5 | Commit `56151d9`; verificación independiente finalmente satisfecha. El primer verificador no entregó dictamen; hubo autorización humana para un nuevo intento. El probe adicional falló inicialmente por falta de `@Import(CatalogSyncTests.Fakes.class)` en el harness, no por un defecto productivo. El rechequeo acotado pasó 1/1 con las mismas aserciones. |
| T4 / S8 y conjunto final | Commit `283645d`; job25 del padre terminó correctamente: 6 pruebas de semillas, 51 de API, 61 de frontend, empaquetado Maven y compilación frontend. Advertencia de tamaño: 634,97 kB frente al objetivo de 500 kB; no se alteró el límite. |
| TDWG real | Job27 del padre: 414 términos, tres fuentes oficiales del mismo commit `4b2c4f2dccaf1b3659877feef8d9e61176112fe5`, sin `lastFailure`; ocho perfiles anteriores intactos y nuevo compuesto exacto. Evidencia: [estado](.browser/evolution-live-catalog-status.json) y [nueve perfiles](.browser/evolution-live-profiles.json). |

La API usada por el navegador fue el runtime separado `backend/target/runtime-evolution/museo-evolution.jar`, ya iniciado por el padre en localhost:8080; Angular permaneció en localhost:4200. No se repitieron suites, builds ni auditoría. La sincronización real ya había ocurrido: no se provocó otra descarga TDWG.

### Recorrido ejecutado con navegador público

Se utilizó directamente agent-browser **0.39.1**, con el Chromium existente y la sesión propia `museum-final-20261022-accept`, cerrada al terminar. Escritorio: 1440×1000; móvil: 390×844. Solo se seleccionó el perfil combinado para los análisis. La normalización permaneció desactivada.

| Regla / prueba | Resultado observado |
|---|---|
| S8, S7: perfil combinado | Visible como publicado 1.0, 56 reglas. Diálogo de solo lectura, campos y picker deshabilitados; descripción española con límites de uso y procedencias Museo/SiB conservadas en su idioma original. No se repitió CRUD. |
| Diálogo escritorio/móvil | Capturas revisadas visualmente. En móvil mide 362 px dentro de 390 px; documento sin desbordamiento horizontal. Contenido con `overflow:auto`, desplazable hasta regla 56, cierre visible. Foco inicial en «Cerrar editor»; Tab permaneció dentro del diálogo; Escape lo cerró y devolvió el foco a «Ver reglas». No es una auditoría exhaustiva de accesibilidad. |
| CSV válido | `examples/museum-and-sib-valid.csv`: un registro, 30 columnas, **0 errores / 0 advertencias / 0 normalizaciones**, con Otros. Al probar antes Colección apareció una advertencia por la columna `disposition` ausente, coherente con la regla condicional; no se oculta esa diferencia de contexto. |
| XLSX existente | `examples/records.xlsx` contiene `With errors` y `Complete`; selección real por teclado de `Complete`: un registro, 30 columnas, **cero incidencias** con combinado y Otros. No se regeneró el libro. |
| S5: CSV inválido | `examples/records-with-errors.csv`, combinado y Otros: **28 incidencias = 27 errores + 1 advertencia**, no los 30 del recorrido histórico con dos perfiles. Son 24 incidencias de encabezado y cuatro de celdas: `scientificName` fila 3, `eventDate` fila 2, `decimalLatitude` fila 2 y `decimalLongitude` fila 3. Error con fondo rojizo, borde, mensaje destacado y texto «! Error»; advertencia con indicador propio. |
| Filtros y descargas | Búsqueda `scientificName` + severidad Error dejó una incidencia visible, fila 3. JSON y CSV descargados bajo el prefijo autorizado contienen las **28 incidencias**, iguales campo a campo y en orden, pese al filtro. Claves `field,row,description,severity,profile,version`, enumerados `ERROR/WARNING`, campos técnicos y filas originales intactos. Mensajes nuevos del compuesto en español. |
| Análisis exclusivamente local | HAR iniciado antes de cargar el CSV inválido y detenido después del diagnóstico: **dos GET** a `worker-JB32ZKYB.js?worker_file&type=module`; ningún POST, upload, `postData` ni cuerpo de solicitud. No aparecen nombre de archivo ni valores de celdas en las solicitudes. El HAR registra estado de respuesta 0: prueba el tráfico emitido, no se usa como prueba HTTP200. |
| S2–S4: mapeo | Origen destacado mediante fondo y peso 900; chips separados por 9,1 px. Clic en `Usar catalogNumber` activó `aria-pressed=true`; Limpiar lo retiró; selección `otherCatalogNumbers` desde picker actualizó el chip correspondiente. Duplicar destino desde `unknownField` mostró «Cada campo de destino puede usarse una sola vez.» y bloqueó continuar; se limpió esa asignación para continuar. No se creó fixture adicional. |
| S1, S13: contextos | Las cinco etiquetas coinciden literalmente con S1. Permiso, colección, muestreo y marinos se marcaron simultáneamente; Otros desmarcó los cuatro; marcar colección desmarcó Otros. Se probaron controles públicos, sin inyectar estado ni cambiar el contrato worker. |
| S6: footer | En contenido corto, footer estático en y967–1000, debajo de main que termina en y946. En listado largo (main de 1479,5 px), tras scrollY626, footer y967,28–1000,28, después de main; no superposición. Capturas revisadas también en diagnóstico móvil. |
| S10, S9: catálogo | Categorías con etiquetas, no URI. `Sin categoría` + `current` + búsqueda `associatedMedia` devolvió exactamente ese término; Restablecer volvió a 414. GET del catálogo confirmó 52 categorías vacías, sin inventar clases de reemplazo. Definiciones oficiales inglesas permanecen originales. |
| Navegación y conservación | Navegar a catálogo y perfiles y volver conservó archivo, diagnóstico 27+1 y filtro. GET públicos posteriores al análisis y mapeo coincidieron íntegramente con los nueve perfiles y el estado de catálogo del padre, incluidos hash activo, intentos y fechas. Los tres archivos originales coinciden byte a byte con HEAD. |
| Consola | Sin errores de aplicación ni excepciones de navegador registrados. Solo mensajes de desarrollo Angular/Vite y aviso NG0751 de carga anticipada de bloques diferidos con HMR. |

### Evidencia local y comandos

Los archivos de `.browser/` son evidencia local excluida de Git, no artefactos publicados. Resumen verificable: [probe-summary.json](.browser/evolution-final/probe-summary.json); [HAR](.browser/evolution-final/analysis.har), [JSON](.browser/evolution-final/diagnostic.json), [CSV](.browser/evolution-final/diagnostic.csv), [XLSX](.browser/evolution-final/xlsx-complete.txt), [filtro](.browser/evolution-final/errors-filtered.txt), [navegación](.browser/evolution-final/diagnostic-after-navigation.txt).

Capturas guardadas **y leídas visualmente**:

- [Diálogo escritorio estable](.browser/evolution-final/screenshot-1792703147111.png), [móvil](.browser/evolution-final/screenshot-1792703014528.png), [regla 56 tras scroll](.browser/evolution-final/screenshot-1792703034579.png).
- [Mapeo seleccionado](.browser/evolution-final/screenshot-1792703047278.png), [mapeo móvil](.browser/evolution-final/screenshot-1792702893084.png).
- [Diagnóstico móvil](.browser/evolution-final/screenshot-1792702987577.png), [filtro escritorio](.browser/evolution-final/screenshot-1792702988095.png), [CSV válido](.browser/evolution-final/screenshot-1792702964430.png), [XLSX válido](.browser/evolution-final/screenshot-1792702979995.png).
- [Footer corto](.browser/evolution-final/screenshot-1792703145490.png), [listado largo](.browser/evolution-final/screenshot-1792703145996.png), [diagnóstico/footer](.browser/evolution-final/screenshot-1792703100208.png).

Selección de comandos efectivamente usados, no un script completo de reproducción (variables muestran el ejecutable y sesión exactos; refs corresponden al snapshot de ese momento):

```bash
B=/home/dark/.npm/_npx/6de2aa2fded2970c/node_modules/.bin/agent-browser
S=museum-final-20261022-accept
"$B" --version
"$B" skills get core
"$B" --session "$S" --executable-path /home/dark/projects/universidad/.browser/chrome-headless-shell-linux64/chrome-headless-shell --download-path /home/dark/projects/universidad/.browser/evolution-final open http://localhost:4200
"$B" --session "$S" snapshot -i
"$B" --session "$S" network har start
"$B" --session "$S" upload 'input[type=file]' /home/dark/projects/universidad/examples/records-with-errors.csv
"$B" --session "$S" find role button click --name 'Validar localmente' --exact
"$B" --session "$S" wait --text 'Descargar JSON'
"$B" --session "$S" network har stop /home/dark/projects/universidad/.browser/evolution-final/analysis.har
"$B" --session "$S" fill @e1552 scientificName
"$B" --session "$S" download @e1547 /home/dark/projects/universidad/.browser/evolution-final/diagnostic.json
"$B" --session "$S" download @e1548 /home/dark/projects/universidad/.browser/evolution-final/diagnostic.csv
"$B" --session "$S" set viewport 390 844
"$B" --session "$S" screenshot --screenshot-dir /home/dark/projects/universidad/.browser/evolution-final --json
"$B" --session "$S" scroll down 29000 --selector .p-dialog-content
"$B" --session "$S" press Escape
"$B" --session "$S" wait --fn '!document.querySelector("[role=dialog]")'
"$B" --session "$S" console
"$B" --session "$S" errors
"$B" --session "$S" close
```

Las interacciones, esperas corregidas, descargas, HAR y cierre terminaron correctamente. El probe Python estándar comparó los GET públicos, exportaciones CSV/JSON y bytes de HEAD; terminó con código 0 y dejó el resumen enlazado. No hay RED significativo para documentación pasiva: se hizo comprobación funcional y lectura estructural, sin afirmar pruebas automatizadas nuevas.

### Incidentes de automatización y límites actuales

- `wait --text 'Diagnóstico de la colección'` agotó 25 s: el título real es «Diagnóstico». Se corrigió la espera a «Descargar JSON»; el diagnóstico ya existía. No fue una avería de análisis.
- Algunos selectores supuestos no existían (`input[type=checkbox][value=other]`, `input[aria-label="Buscar incidencias"]`) o un diálogo todavía estaba animando al intentar navegar. Se usaron snapshots y espera de desaparición del diálogo. El intento final de limpiar búsqueda no se ejecutó: el filtro permaneció activo, declarado en las capturas.
- Intentar continuar con destino duplicado dejó el botón deshabilitado, por lo que una espera posterior de diagnóstico agotó 25 s. Al limpiar **unknownField**, desapareció el conflicto y se completó el análisis. Limpiar solamente catalogNumber no quita su destino implícito original; esto no se presentó como un fallo productivo.
- La CLI aceptó inicialmente rutas posicionales de screenshot pero guardó por defecto fuera del proyecto. Ruta externa conocida reportada por el worker: `/home/dark/.agent-browser/tmp/screenshots/screenshot-1792702857070.png`; podría haber otras capturas iniciales en esa ubicación predeterminada. Se informó al padre, que no leyó, movió ni borró esos archivos. Su limpieza requeriría autorización específica y no se presenta como realizada. El formato corregido `--screenshot-dir` guardó las capturas posteriores dentro del prefijo autorizado. Una captura temprana también tomó el diálogo durante animación: se conservó como evidencia no concluyente y se sustituyó por la captura estable enlazada.
- En móvil, tablas, progreso y navegación usan desplazamiento horizontal interno; se observa recorte de columnas fuera de su viewport, sin desbordamiento horizontal global. No se afirma que todas las columnas quepan simultáneamente en 390 px. No se revalidó cada caso T1, CRUD de perfiles, todos los contextos biológicos ni todas las opciones del catálogo.
- No se atribuye a este navegador la verificación arquitectónica S11/S12 ni toda la sincronización S9: su respaldo está en T1–T4 y en los resultados del padre/independientes descritos arriba. No se reclama aprobación nativa ni auditoría aprobada.

## Historial previo a la evolución

Las secciones siguientes conservan resultados y fallos anteriores; sus conteos y bloqueos no describen el estado integrado actual.

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
