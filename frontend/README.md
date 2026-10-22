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

1. Seleccionar un CSV UTF-8 separado por comas o un XLSX. Para Excel, elegir explícitamente una hoja.
2. Elegir uno o varios perfiles publicados. Los borradores no se ejecutan.
3. Mapear los encabezados a campos Darwin Core con el selector PrimeNG compartido con el editor de reglas. Abrir la flecha para buscar; usar las flechas del teclado y Enter para elegir. También se conserva la escritura libre de campos existentes. Los encabezados de origen están resaltados; las sugerencias separadas muestran su selección. «Limpiar» deja el destino sin asignar y desmarca la sugerencia. Los nombres exactos se reconocen sin cambios. No se permiten dos columnas de origen con el mismo destino.
4. Si se desea, activar el recorte de espacios y/o tratar `NULL` y `N/A` como vacíos. Revisar los cambios de los primeros 20 registros. Ambas opciones están desactivadas inicialmente y solo cambian una copia de trabajo.
5. Indicar los contextos y validar localmente:
   - Asociados a un permiso de recolección o acceso a recursos genéticos.
   - Colección biológica.
   - Eventos de muestreo.
   - Marinos.
   - Otros: observaciones en campo, registros fortuitos u otros orígenes no contemplados.

   Los cuatro primeros son combinables. Otros desmarca los cuatro y cualquiera de ellos desmarca Otros. No agrega condiciones al contrato de validación. La condición técnica `permitAndCollection` sigue requiriendo permiso y colección a la vez.
6. Filtrar y paginar el diagnóstico; descargar todas las incidencias como JSON o CSV. Cada una conserva campo, fila de origen, descripción, severidad, perfil y versión. En CSV se antepone un apóstrofo a las celdas que podrían ejecutarse como fórmulas de hoja de cálculo.

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

Crear un perfil abre un diálogo modal con datos del perfil y grupos de reglas: campo, comprobación, condición, severidad, mensaje y fuente. Guardar como borrador, editarlo o publicarlo explícitamente. Escape o «Cerrar editor» cierran el diálogo sin guardar; el foco vuelve al control que lo abrió. Un error al guardar mantiene el diálogo, el contenido y el mensaje de error. Las versiones publicadas son de solo lectura, incluido el selector de campos: se duplican en otra versión para evolucionar las reglas.

Solo se informa éxito cuando responde correctamente la API. Los errores permanecen visibles; no hay persistencia local ni éxito simulado como reemplazo de una solicitud fallida. El backend rechaza cambios concurrentes mediante `revision`; actualizar los datos del servidor antes de volver a guardar.

Contrato de API:

- `GET /api/catalog` y `GET /api/profiles`.
- `POST /api/profiles` con `{name,version,description,rules}`.
- `PUT /api/profiles/{id}` con los mismos campos y `revision`.
- `POST /api/profiles/{id}/duplicate` con `{name,version}`.
- `POST /api/profiles/{id}/publish` con cuerpo **completamente vacío**.

No se usa ningún endpoint de carga de archivos.

## Consultar el catálogo

La búsqueda, la categoría y el estado se combinan. «Restablecer filtros» vuelve a mostrar todos los términos. Las categorías muestran el último segmento de su URI solo como etiqueta; el filtro conserva el valor canónico. «Sin categoría» indica ausencia, no una clasificación oficial nueva. Los estados y las definiciones siguen siendo los de la fuente.

Los errores del diagnóstico se distinguen por texto, indicador y énfasis de fila y mensaje, además del color. Las descargas siguen incluyendo el diagnóstico completo aunque la tabla esté filtrada. El pie ocupa el fondo de la ventana cuando hay poco contenido y sigue al contenido cuando la página crece; no se superpone.

## Arquitectura

| Módulo | Responsabilidad |
|---|---|
| `analysis/model.ts` | Contratos compartidos de interfaz, worker y perfiles; límites |
| `analysis/parser.ts` | Lectura estricta de CSV y conversión de matrices de hojas de cálculo |
| `analysis/normalizer.ts` | Transformaciones optativas e inmutables con registro de cambios |
| `analysis/validator.ts` | Reglas independientes por perfil y comprobaciones básicas |
| `analysis/analysis.worker.ts` | Lectura y validación local; cancelación por terminación e identificadores que descartan respuestas antiguas |
| `analysis/export.ts` | JSON y CSV con neutralización de fórmulas |
| `api.ts` | Límite exclusivo de metadatos; TanStack Query administra lecturas, invalidación y errores |
| `shared/dwc-picker.ts` | Selector PrimeNG compartido; adaptador CVA interno a señales de Angular 21, sin estado de selección duplicado |
| `import/column-mapping.ts` | Presentación de encabezados y sugerencias; emite cambios al helper `map` del workbench |
| `import/record-context.ts` | Controles de contexto; el workbench conserva el estado y el contrato de cuatro booleanos |

El workbench conserva la orquestación del worker, invalidación, destinos únicos y exportación; permanece montado al navegar. Los componentes de presentación no reimplementan parser, normalización, validación ni exportación.

La localización debe conservar estos límites y no introducir escrituras en datos originales o publicaciones históricas.

## Versiones y licencias de dependencias

PrimeNG está fijado en **21.1.10**, versión comunitaria MIT verificada mediante el registro npm y el archivo distribuido `node_modules/primeng/LICENSE.md`. Ese archivo otorga MIT a la edición comunitaria; las condiciones comerciales LTS corresponden a versiones con sufijo `-lts`, que no se utilizan. Las versiones estables 22 disponibles al migrar exigían clave PrimeUI. No se inyectan claves, se ocultan avisos con CSS ni se modifica código del proveedor.

`@primeuix/themes` está fijado en **2.0.3**: su `LICENSE` es MIT, al igual que los paquetes PrimeUI instalados de estilos, utilidades y movimiento. No se utilizan temas 3.x. Conservar los avisos de autoría y permiso al redistribuir las dependencias MIT.

Angular, compilador y formularios están alineados en **21.2.25**; CDK en **21.2.14**; CLI/build en **21.2.27**, según la compatibilidad requerida por PrimeNG. TypeScript **5.9.3** satisface `>=5.9 <6.0`; Vitest **4.1.12** satisface `^4.0.8`. Los formularios basados en señales de Angular 21 son experimentales; se utiliza su API compatible de deshabilitación manteniendo el bloqueo de publicaciones. Se eliminó la sustitución de Vite 8; el conjunto compatible resuelve **Vite 7.3.6**.

TanStack Query **5.104.5** y el lector XLSX `read-excel-file` **9.3.12** se conservaron. Guardar el lockfile junto con cambios de versiones y utilizar `npm ci` para reproducir el conjunto. Una instalación o compilación correcta no equivale a una auditoría de seguridad.

La auditoría adicional autorizada agotó cinco minutos con código 124 y sin resultados. El usuario aceptó expresamente la entrega con esa verificación pendiente. No hay una auditoría aprobada ni reintentos automáticos; consultar [el informe](../VERIFICATION.md).
