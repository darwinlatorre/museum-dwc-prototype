# Área de trabajo de las colecciones del museo

Angular **21.2.25**, PrimeNG **21.1.10** y TanStack Query **5.104.5** ofrecen una interfaz de gestión para revisar la calidad de archivos locales. La API almacena exclusivamente metadatos de catálogo y perfiles versionados. Los bytes del archivo y sus registros no se envían al servidor.

## Ejecución

Desde `frontend/`, ejecutar `npm ci` y luego `npm start`. Abrir http://localhost:4200. El proxy de desarrollo dirige `/api` a http://127.0.0.1:8080; iniciar primero el backend.

```bash
npm test -- --watch=false
npm run build
```

Un alojamiento futuro debe servir `dist/frontend/browser` y dirigir `/api` al backend desde el mismo origen. Este MVP debe permanecer en un entorno local confiable: no implementa ni simula autenticación. La integración OIDC/Keycloak se incorporará posteriormente al límite de metadatos.

## Analizar una colección

1. Seleccionar un CSV UTF-8 separado por comas o un XLSX. Para Excel, elegir explícitamente una pestaña en «Seleccione la hoja de cálculo que desea analizar» y pulsar «Leer la hoja seleccionada».
2. Elegir uno o varios perfiles publicados. Los borradores no se ejecutan.
3. Mapear los encabezados a campos Darwin Core con el selector PrimeNG compartido con el editor de reglas. Escribir y filtrar en el único campo que muestra el destino actual; la flecha abre directamente la lista, alineada al ancho del campo. Usar las flechas del teclado y Enter para elegir. También se conserva la escritura libre de campos existentes. Los encabezados de origen están resaltados; las sugerencias separadas muestran su selección. «Limpiar» retira la asignación explícita y desmarca la sugerencia; no elimina la columna ni desactiva el reconocimiento implícito de su encabezado original. Los nombres Darwin Core exactos se reconocen sin cambios. No se permiten dos columnas de origen con el mismo destino.
4. Si se desea, activar el recorte de espacios y/o tratar `NULL` y `N/A` como vacíos. Revisar los cambios de los primeros 20 registros. Ambas opciones están desactivadas inicialmente y solo cambian una copia de trabajo.
5. Indicar los contextos y validar localmente:
   - Colección biológica.
   - Asociados a un permiso de recolección o acceso a recursos genéticos.
   - Eventos de muestreo.
   - Marinos.
   - Otros: observaciones en campo, registros fortuitos u otros orígenes no contemplados.

   Los cuatro primeros son combinables. Otros desmarca los cuatro y cualquiera de ellos desmarca Otros. No agrega condiciones al contrato de validación. La condición técnica `permitAndCollection` sigue requiriendo permiso y colección a la vez.
6. Filtrar y paginar el diagnóstico; descargar todas las incidencias como JSON o CSV. Cada una conserva campo, fila de origen, descripción, severidad, perfil y versión. En CSV se antepone un apóstrofo a las celdas que podrían ejecutarse como fórmulas de hoja de cálculo.

Los botones del progreso permiten volver a los pasos disponibles sin perder archivo, mapeo, opciones, contexto ni diagnóstico vigente. Se requiere un archivo leído para elegir perfiles, al menos un perfil publicado para mapear y destinos únicos para continuar. El diagnóstico solo está disponible tras validar; editar entradas lo invalida. La navegación por sí sola no cancela ni reinicia el worker.

El área principal conserva como mínimo el espacio disponible de la ventana y crece verticalmente con su contenido; el pie se desplaza debajo, sin superponerse. El ancho sigue limitado al espacio disponible. Las tablas anchas se desplazan dentro de su propia región, sin ensanchar la página.

Cada encabezado de origen ocupa una fila de mapeo: selector de destino, «Limpiar» compacto a su lado y equivalencias a la derecha. Las filas mantienen un fondo uniforme, separadores finos de 1 px —incluido el borde izquierdo del encabezado— y resaltado al enfocar o pasar el cursor, sin repetir «Origen» junto a cada encabezado. Las equivalencias muestran solo el nombre del término, con botones pequeños en una franja horizontal desplazable cuando no caben. La opción seleccionada mantiene relleno verde sólido y texto blanco, también al pasar el cursor, sin borde blanco interior. Los campos indican foco con el borde verde y el resaltado de fila, sin contorno amarillo; los botones y enlaces conservan una indicación verde para navegación por teclado. No se aplican automáticamente. El desplegable conserva el ancho del campo y una única entrada de búsqueda. En Excel, «Leer la hoja seleccionada» queda separado del selector por un margen superior.

Los selectores de formularios, filtros, destinos y cantidad por página comparten altura, borde, tipografía, flecha y estados de foco/deshabilitado. Se conservan la edición libre del destino DwC y los controles nativos existentes; la ventana de opciones nativa sigue dependiendo del navegador/sistema operativo. Todas las tablas permiten elegir cantidad por página: perfiles, mapeo, vista previa de normalización, diagnóstico y catálogo. Se mantienen sus cantidades iniciales anteriores y los filtros/exportaciones no se limitan a la página visible.

### Límites y conservación del origen

Se permiten hasta **10 MiB**, **50 000 registros**, **500 columnas** y **100 000 incidencias**. Se rechazan comillas mal formadas, filas CSV de ancho inconsistente, encabezados vacíos y duplicados equivalentes al ignorar mayúsculas o espacios.

Las filas de CSV corresponden a líneas físicas, incluidas las filas vacías y las celdas entrecomilladas con saltos de línea. Las de XLSX corresponden a la posición original de la hoja. Las celdas de fecha de Excel se representan como fechas ISO para validarlas. Los huecos de filas y columnas se completan, sin desplazar registros.

Se puede cancelar el proceso terminando el worker. Un cambio de mapeo, perfiles, normalización, contexto o metadatos invalida el diagnóstico anterior. Se procesa un archivo y una hoja por vez. La descompresión de XLSX **no es incremental**: un archivo comprimido puede consumir más memoria que su tamaño. Si sucede, cancelar o utilizar un CSV más pequeño; el límite de entrada no garantiza el uso máximo de memoria.

### Comprobaciones básicas

Siempre se comprueban los valores no vacíos de:

- `eventDate`: fecha de calendario exacta `YYYY-MM-DD`.
- `year`, `month`, `day`: enteros válidos, años bisiestos y coherencia entre componentes y `eventDate`.
- `decimalLatitude`, `decimalLongitude`: números finitos dentro de ±90 y ±180, respectivamente.

Los valores opcionales vacíos se permiten. Los perfiles deciden qué columnas y valores son obligatorios; `requiredColumn` no exige contenido no vacío. Las columnas desconocidas generan advertencias del sistema con posibles equivalencias. Estos resultados orientan la calidad y **no certifican una publicación SiB**. No se validan extensiones fuera de los tipos de regla configurados.

## Idioma de la interfaz y los datos

Los textos de la interfaz, mensajes del sistema, ayudas y etiquetas del diagnóstico se presentan en español. Los valores técnicos `DRAFT`, `PUBLISHED`, `ERROR`, `WARNING`, tipos y condiciones conservan su contrato; sus etiquetas se traducen para mostrarlos. Las claves JSON no se renombran.

Los términos Darwin Core, URI, nombres científicos y valores de los archivos permanecen intactos. Las definiciones oficiales TDWG se muestran como citas originales con el idioma de la fuente indicado. Los nombres, descripciones o mensajes creados por usuarios son datos, no textos que se deban traducir automáticamente. Los textos predeterminados conocidos de los perfiles iniciales se localizan para presentación, sin reescribir versiones publicadas ni cambiar sus reglas.

## Administrar perfiles

Crear un perfil abre un diálogo modal con datos del perfil y grupos de reglas: campo, comprobación, condición, severidad, mensaje y fuente. Los seis campos de cada regla se distribuyen en tres columnas y dos filas en escritorio; en pantallas angostas se apilan para conservar su legibilidad. «Eliminar regla» mantiene su ubicación debajo del grupo. Guardar como borrador, editarlo o publicarlo explícitamente. Escape o «Cerrar editor» cierran el diálogo sin guardar; el foco vuelve al control que lo abrió. Un error al guardar mantiene el diálogo, el contenido y el mensaje de error. Las versiones publicadas son de solo lectura, incluido el selector de campos: se duplican en otra versión para evolucionar las reglas.

Solo se informa éxito cuando responde correctamente la API. Los errores permanecen visibles; no hay persistencia local ni éxito simulado como reemplazo de una solicitud fallida. El backend rechaza cambios concurrentes mediante `revision`; actualizar los datos del servidor antes de volver a guardar.

Contrato de API:

- `GET /api/catalog` y `GET /api/profiles`.
- `POST /api/catalog/sync` con cuerpo completamente vacío; resultado `{outcome,status}`.
- `POST /api/profiles` con `{name,version,description,rules}`.
- `PUT /api/profiles/{id}` con los mismos campos y `revision`.
- `POST /api/profiles/{id}/duplicate` con `{name,version}`.
- `POST /api/profiles/{id}/publish` con cuerpo **completamente vacío**.

No se usa ningún endpoint de carga de archivos.

## Consultar el catálogo

La búsqueda, la categoría y el estado se combinan. «Restablecer filtros» vuelve a mostrar todos los términos. Las categorías muestran el último segmento de su URI solo como etiqueta; el filtro conserva el valor canónico. «Sin categoría» indica ausencia, no una clasificación oficial nueva. Los estados y las definiciones siguen siendo los de la fuente.

«Sincronizar con TDWG» solicita una actualización real, no solo otro GET del catálogo. La acción se ubica junto al encabezado y al total de términos, separada de los filtros. El botón mantiene su ancho al mostrar «Sincronizando…», con indicador animado (sin animación si se prefiere movimiento reducido), y queda deshabilitado mientras espera. Una región de estado permanente anuncia actividad y resultado sin insertar o retirar barras; se puede seguir filtrando el catálogo durante la consulta. Se diferencia éxito confirmado, fallo con última versión válida conservada e intento reemplazado por otro más reciente; un HTTP 200 no basta para anunciar éxito. Al terminar se invalida la caché compartida del catálogo para actualizar los términos, sin modificar perfiles ni enviar archivos. Ante un fallo de transporte se informa que el resultado no pudo confirmarse, sin afirmar que el servidor no hizo cambios.

Los errores del diagnóstico se distinguen por texto, indicador y énfasis de fila y mensaje, además del color. Las descargas siguen incluyendo el diagnóstico completo aunque la tabla esté filtrada. El pie queda debajo del área principal, al fondo de la ventana si hay poco contenido y más abajo cuando el contenido crece, sin superponerse.

## Arquitectura

| Módulo | Responsabilidad |
|---|---|
| `features/catalog` | Catálogo, HTML, SCSS, pruebas y contrato `Term` |
| `features/profiles` | Perfiles, editor, HTML, SCSS, pruebas y sus contratos de reglas |
| `features/importer/workbench` | Orquestación de importación, navegación y worker |
| `features/importer/components` | Mapeo y contexto, cada componente en su carpeta |
| `features/importer/engine` | Parser, normalizador, validador, exportación y worker local |
| `features/importer/models` | Dataset, límites, contexto, resultados, normalización y protocolo del worker |
| `core/api` y `core/i18n` | Transporte exclusivo de metadatos y presentación localizada |
| `shared/ui/dwc-picker` | Selector reutilizable de una entrada, adaptado a Signal Forms |
| `shared/design-system` | Paleta CSS única, tokens, primitivas, adaptación PrimeNG y preset |
| `testing` | Pruebas de composición y costuras entre funcionalidades |

La estructura y sus límites están en [ARCHITECTURE.md](ARCHITECTURE.md); los tokens y patrones visuales, en [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Desde `frontend/`, ejecutar `node scripts/check-architecture.mjs` para detectar rutas antiguas, contratos duplicados e importaciones indebidas. No reemplaza pruebas ni build.

El workbench conserva la orquestación del worker, invalidación, destinos únicos y exportación; permanece montado al navegar. Los componentes de presentación no reimplementan parser, normalización, validación ni exportación.

La localización debe conservar estos límites y no introducir escrituras en datos originales o publicaciones históricas.

## Versiones y licencias de dependencias

PrimeNG está fijado en **21.1.10**, versión comunitaria MIT verificada mediante el registro npm y el archivo distribuido `node_modules/primeng/LICENSE.md`. Ese archivo otorga MIT a la edición comunitaria; las condiciones comerciales LTS corresponden a versiones con sufijo `-lts`, que no se utilizan. Las versiones estables 22 disponibles al migrar exigían clave PrimeUI. No se inyectan claves, se ocultan avisos con CSS ni se modifica código del proveedor.

`@primeuix/themes` está fijado en **2.0.3**: su `LICENSE` es MIT, al igual que los paquetes PrimeUI instalados de estilos, utilidades y movimiento. No se utilizan temas 3.x. Conservar los avisos de autoría y permiso al redistribuir las dependencias MIT.

Angular, compilador y formularios están alineados en **21.2.25**; CDK en **21.2.14**; CLI/build en **21.2.27**, según la compatibilidad requerida por PrimeNG. TypeScript **5.9.3** satisface `>=5.9 <6.0`; Vitest **4.1.12** satisface `^4.0.8`. Los formularios basados en señales de Angular 21 son experimentales; se utiliza su API compatible de deshabilitación manteniendo el bloqueo de publicaciones. Se eliminó la sustitución de Vite 8; el conjunto compatible resuelve **Vite 7.3.6**.

TanStack Query **5.104.5** y el lector XLSX `read-excel-file` **9.3.12** se conservaron. Guardar el lockfile junto con cambios de versiones y utilizar `npm ci` para reproducir el conjunto. Una instalación o compilación correcta no equivale a una auditoría de seguridad.

La auditoría adicional autorizada agotó cinco minutos con código 124 y sin resultados. El usuario aceptó expresamente la entrega con esa verificación pendiente. No hay una auditoría aprobada ni reintentos automáticos; consultar [el informe](../VERIFICATION.md).
