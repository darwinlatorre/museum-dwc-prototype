# Motor de normalización local

La normalización crea una copia reversible **desde el original**, nunca desde la copia anterior. El análisis, preview y Aplicar no envían datos al servidor. **Finalizar → Confirmar e importar** es una acción diferente: con consentimiento explícito envía originales, valores de trabajo, cabeceras y asignaciones para persistir registros en PostgreSQL; nunca el archivo ni su nombre. Esta documentación cubre el motor y esa frontera; no acredita aceptación visual en navegador.

## Uso y compatibilidad

`normalize(original, options, mapping?)` conserva `{ data, changes }`. `Change` sigue teniendo exclusivamente `row`, `field`, `before`, `after`, en orden fila/columna; `field` es el encabezado original. Los llamadores de dos argumentos y `{ trim, emptyMarkers }` mantienen el resultado anterior. Todos los flags nuevos son opcionales y apagados por defecto.

`normalizeCell(before, effectiveField, options)` es la regla compartida entre aplicación, preview y proyección de requeridos. El destino se resuelve por propiedad **propia** de mapping con fallback al encabezado literal: no se traducen nombres ni se infieren tipos de `rdf_type`. `toString` y `__proto__` no consultan propiedades heredadas. Encabezados, valores, filas físicas y originales no se modifican.

## Política de Normalizar y compatibilidad del motor

El pedido explícito S1 de `odd/tasks/normalization-simplification.md` y el [contrato vigente](../design/normalization-live-preview/simplification-contract.md) sustituyen el opt-in anterior **solo en Normalizar y Aplicar**: trim, emptyMarkers, dates, coordinates, numbers y duplicates siempre son true; no hay seis interruptores de reglas. El workbench deriva las opciones únicamente de los modos de fecha/separador, inicialmente `safe`. Los selects nativos siguen permitiendo DMY/MDY y coma explícitos sin poder desactivar reglas. La hoja comienza en **Con cambios** y mantiene **Todos** al lado; **Ocultar columnas sin datos** sigue siendo solo presentación.

El diagnóstico inicial y su resumen/detalle de obligatorios usan originales con `{ trim: false, emptyMarkers: false }`. Entrar en Normalizar o cambiar formatos no aplica ni valida automáticamente: solo **Aplicar normalización y validar** captura las seis reglas y los modos actuales. Originales, precisión, rangos, registro cerrado DwC e identificadores permanecen protegidos. Los defaults compartidos del motor no cambian; la tabla siguiente describe sus opciones de bajo nivel.

## Revisión compacta y ventana confirmada

- **Con cambios** incluye filas con algún valor distinto del original en cualquier columna, aunque esté oculta o fuera de la ventana. Un duplicado sin cambios no se incluye. **Todos** recupera el conjunto completo, sin eliminar ni fusionar registros.
- Cada sesión de archivo/hoja/mapeo inicia con `rowFilter: 'changed'` explícito. Cambiar vista solo envía `preview-page` con offset0; no reenvía originales/opciones, recalcula, invalida el análisis ni valida. Los cambios de formato mantienen la vista elegida y reinician offset0; reintentar conserva esa elección.
- La selección solicitada se distingue de `window` confirmada. Mientras llega la última página, la hoja conserva filas, nombre y rango anteriores, con aviso de ventana anterior/busy y Aplicar deshabilitado. Solo se aceptan id/sesión/generación y filtro vigentes. Un update durante paginación descarta páginas anteriores.
- Rango y última página usan `changedRows` o `totalRows` según el filtro confirmado. Vacío: **0–0 de 0**. Metadata, duplicados y columnas vacías describen siempre el dataset completo, no la página ni solo los cambios. `columnIndices: []` conserva filas físicas.
- **Sin cambios** aparece únicamente con ventana vigente Con cambios vacía; no sustituye carga, cancelación o error. Los avisos globales permanecen disponibles. **Mostrar todos** devuelve foco al botón persistente Todos al retirar el CTA.
- **Formatos y reglas** y **Duplicados** son disclosures nativos inicialmente cerrados. El primero conserva selects nativos y ayuda de ambigüedad; el segundo conserva grupos y filas físicas. Tabla con valores literales planos y badges de regla; visualizador de espacios solo en detalle original/copia exactos. Flechas recorren celdas, Tab sale y Escape cierra sin robar foco externo. Cambiar vista/página/formato cierra el detalle obsoleto.

Estas comprobaciones públicas/estructurales no certifican geometría de escritorio/móvil ni accesibilidad exhaustiva; aceptación integrada y navegador pendientes en T4.

## Reglas del motor

| Opción | Cobertura | Conservación |
|---|---|---|
| `trim` | Solo espacios exteriores | No limpia interiores ni cambia case |
| `emptyMarkers` | NULL y N/A, sin distinguir case, después de trim si está aprobado | Sin consentimiento siguen siendo datos |
| `dates` | `eventDate`, `dateIdentified`, `georeferencedDate`, `measurementDeterminedDate`, `modified` | Calendario sin rollover; conserva año0001, precisión y zona |
| `coordinates` | `decimalLatitude`, `decimalLongitude` | Grados decimales, ±90/±180 inclusivos, comparación exacta sin redondeo; no DMS, datum ni unidades |
| `numbers` | Lista cerrada inferior | Sin conversión de identificadores, verbatim, desconocidos o `measurementValue` (admite UV-light) |
| `duplicates` | Dos criterios independientes sobre la copia actual | Solo asesoría, sin eliminar, fusionar ni crear Change |

Cantidades decimales: `sampleSizeValue`, `minimumElevationInMeters`, `maximumElevationInMeters`, `minimumDepthInMeters`, `maximumDepthInMeters`, `minimumDistanceAboveSurfaceInMeters`, `maximumDistanceAboveSurfaceInMeters`, `coordinateUncertaintyInMeters`, `coordinatePrecision`.

Enteros: `individualCount`, `year`, `month`, `day`, `startDayOfYear`, `endDayOfYear`. Las representaciones enteras ya válidas pueden quedar literalmente iguales. No se convierten fracciones a enteros, ni negativos de individualCount en valores válidos. Las reglas no sustituyen los diagnósticos básicos existentes ni agregan validación exhaustiva de todos estos campos.

- `dateOrder: 'safe'` (predeterminado): conserva ISO común válido; convierte año/mes/día completo inequívoco como `2024/02/29` a `2024-02-29`. `03/04/2024` no cambia. `DMY` o `MDY` permiten interpretar explícitamente día/mes/año o mes/día/año con separadores `/`; no inventan componentes. Una fecha inválida permanece inválida.
- `decimalMode: 'safe'` (predeterminado): no reinterpreta comas. `comma` permite una coma decimal sin separadores de miles. Conserva signo, ceros, todos los dígitos y precisión; no utiliza Number/parseFloat para reescribir valores. No convierte notación científica, NaN, Infinity ni sintaxis inválida. Un decimal con punto ya válido puede permanecer igual.
- La validación básica de `eventDate` acepta año, año-mes, fecha, fecha-hora (minutos o segundos, fracción de segundos, con/sin zona) e intervalos de dos extremos ISO comunes. Verifica calendario y componentes de tiempo. Compara year/month/day solo contra componentes presentes e inequívocos; no contra intervalos. No se anuncia soporte de toda ISO8601-1:2019. Se conserva el mensaje histórico de error para entradas inválidas por compatibilidad.

Autoridad: [TDWG Darwin Core](https://dwc.tdwg.org/list/), alcance investigado en L4 de `odd/tasks/normalization-live-preview.md`. No se amplía el catálogo backend ni se deducen tipos de Property.

## Preview persistente para el consumidor T3

Contrato tipado: `models/normalization-preview.ts`; worker: `engine/normalization-preview.worker.ts`. Es **independiente** de `analysis.worker.ts`: parse sigue siendo efímero, mientras el análisis validado ahora conserva originales y valores efectivos para preparar una confirmación sin recalcular ni aplicar reglas implícitas.

1. Crear un worker módulo relativo al workbench y enviar `preview-init` con original, mapping, opciones y ventana. El clon recibido por postMessage se conserva una vez en el worker. Cambiar archivo/hoja/mapeo exige nueva sesión; terminar el worker anterior al descartar el workbench.
2. Cada cambio de opciones envía `preview-update` sin dataset/mapping, con generación creciente. Toda actualización parte del original cacheado. Un cálculo nuevo sustituye al pendiente; no se publica una respuesta del cálculo sustituido.
3. `preview-ready` entrega metadata completa y una ventana; `preview-page` solo entrega la ventana solicitada del snapshot ya calculado. No vuelve a normalizar, detectar duplicados ni recorrer datos fuera de esa página.
4. Ventanas: `rowFilter?: 'all' | 'changed'`; omitido equivale a `all` y conserva la forma anterior de respuesta sin agregar la propiedad. Un filtro explícito se confirma literalmente en `window` de ready/page. Offset entre0 y el tamaño de la vista (`totalRows` para all, `changedRows` para changed), inclusive; el extremo devuelve cero filas y un offset mayor produce `Ventana de vista previa inválida.`, sin clamp. Límites10/25/50/100 y hasta50 índices fuente distintos, no necesariamente contiguos. `columnIndices: []` conserva filas físicas sin celdas, incluso con cero columnas fuente. Usar `metadata.columns` y `emptyColumnIndices` completos para seleccionar columnas visibles, no solo las primeras50. Una columna es vacía si todos los valores actuales cumplen `after.trim() === ''`; ocultarla no afecta cambios ni duplicados.
5. `id` único global por mensaje, `session` creciente por original/mapping y `generation` creciente por opciones. Verificar `isPreviewResponse(unknown)` antes de usar respuestas; aceptar ready/page únicamente para tokens e id actuales del consumidor. Error conserva tokens válidos; token malformado devuelve0/0/0. Nunca tratar un error como una página vacía.
6. Cancel envía `preview-cancel` para la generación actual y recibe `preview-cancelled`. Conserva el último snapshot con **sus tokens anteriores**; sus páginas solo pueden solicitarse con esa generación. Reintentar usa update con generación nueva. Una sesión nueva no permite páginas de otra sesión. Error de compute conserva el último snapshot válido.

Cambiar filtro reinicia offset en el consumidor y solo envía `preview-page`, sin originales, opciones ni generación nueva. El consumidor correlaciona id/sesión/generación y filtro confirmado; mientras espera no debe etiquetar la página anterior con el filtro solicitado. Los filtros inválidos se rechazan antes de modificar estado. Los duplicados y metadatos de columnas siempre describen TODAS las filas normalizadas, aunque changed esté vacío.

El cálculo usa un generador compartido y tareas de event loop entre lotes acotados (no solo microtasks). Almacena valores, máscaras compactas por fila cambiada y conteos; comparte filas sin cambios. Cachea posiciones fuente de filas con algún `after !== before` en el mismo bucle existente, incluyendo columnas ocultas/no mapeadas/fuera de ventana. Un aviso de duplicado sin cambio literal no incluye la fila. Leer páginas selecciona esas posiciones sin reescanear ni recalcular; `sourceRow` sigue siendo la identidad física original. El índice completo nunca cruza al hilo principal. Solo materializa `PreviewCell` para la ventana. El snapshot completo de preview nunca cruza postMessage ni va a Query/cache. El helper síncrono `buildNormalizationPreview` es para pequeños consumidores puros/pruebas; no llamarlo desde la UI para datasets grandes.

## Duplicados y Aplicar

- Filas completas: clave estructural JSON de todas las celdas en orden fuente, incluidas ocultas/no mapeadas; excluye solo identidad física.
- IDs: destino exacto `occurrenceID`; omite blancos pero compara el texto actual exacto. Case y ceros distinguen IDs. Un ID repetido puede tener otras celdas distintas.
- Los grupos tienen más de un miembro, namespaces `row:` e `id:`, todas las filas físicas (incluso fuera de página) y conteos separados. Una fila puede pertenecer a ambos criterios. No sumar afectados como si fueran filas únicas.
- `enabled: false` significa no comprobado. `occurrenceIdColumnIndex: null` permite informar «Sin occurrenceID mapeado; se comprobaron las filas completas» sin desactivar el criterio de fila.
- Aplicar usa el mismo detector y añade WARNING por miembro/criterio con tamaño y primera fila, no listas gigantes repetidas. Conserva claves y límite `LIMITS.issues` del informe JSON/CSV; superar100.000 produce el mismo error existente, no un resultado parcial. Los informes siguen siendo diagnósticos, no exportaciones biológicas.

La integración debe conservar **todas** las opciones en diagnosticOptions, capturar mapping/contexto/revisión al aplicar y mantener separadas las invalidaciones de preview y diagnóstico. No ejecutar validación automáticamente al elegir formatos ni al ocultar columnas. La gestión de busy, foco, detalle original y errores del navegador pertenece al workbench.

## Finalizar: confirmación y preparación local (T3)

Finalizar resume registros, columnas, errores, advertencias y ambos criterios de duplicados del **análisis vigente**, no de la vista previa. Los duplicados siguen siendo avisos no destructivos en diagnóstico, pero bloquean la persistencia del lote completo, igual que cualquier ERROR. Las advertencias restantes requieren su propia casilla de consentimiento. La autorización de salida y almacenamiento en PostgreSQL es independiente. No se transmiten filas al navegar, elegir formatos, paginar ni abrir Finalizar.

Se puede nombrar una colección nueva sin recortar su nombre o elegir una existente por páginas de 50; solo son seleccionables las del mismo contexto. Se captura su revisión para la escritura. El servidor vuelve a validar y rechaza todo el lote ante errores o duplicados internos/activos en esa colección; el cliente no los omite ni promete aceptación anticipada. La API y los errores exactos están en [COLLECTIONS_ARCHITECTURE.md](../backend/COLLECTIONS_ARCHITECTURE.md).

El shell conserva las consultas de metadatos. Su instantánea versionada lee estado → términos → estado y rechaza versiones distintas. Una nueva versión/configuración/disponibilidad invalida el diagnóstico y exige validación nueva. `catalog()` conserva su API anterior. Solo los metadatos se almacenan en el QueryClient raíz; los contratos y `CollectionsApi` pertenecen a `features/collections`, y las lecturas/escrituras biológicas **no usan Query**.

`models/worker-protocol.ts` añade sesión/generación a validate y prepare. El primer validate entrega originales; validaciones explícitas siguientes reutilizan ese worker y mandan solo opciones/metadatos. Cada cálculo parte de originales inmutables. Invalidar termina el worker y rechaza preparaciones pendientes; cambiar archivo/mapeo crea otra sesión. Preparar solo se solicita después de Confirmar, mediante ventanas pull de hasta 256 filas y presupuesto de 256 Ki unidades UTF-16, salvo una fila individual indivisible. Se conservan `sourceRow`, orden de cabeceras, mapping, originales y valores efectivos del último análisis. Antes de HTTP se comprueban los límites por campo, texto persistible, 20 Mi unidades UTF-16 acumuladas y 32 MiB del JSON real: nunca truncamiento ni coerción.

Con diagnóstico crudo se envían valores crudos, aunque se haya visitado Normalizar. Solo **Aplicar normalización y validar** cambia los valores enviados. La preparación verifica worker/id/sesión/generación y se descarta si cambió el análisis; cancelar preparación no envía nada. No se clona el dataset por toggles de presentación.

Cada confirmación usa un UUID. Preparación/envío impiden doble clic y cambios de destino. Una respuesta perdida o error incierto conserva exactamente cuerpo/UUID; **Reintentar la misma confirmación** es explícito y no genera otra clave. No se afirma rollback ante incertidumbre. Un rechazo conocido permite otra confirmación; cambios de configuración, catálogo o revisión requieren actualizar y reanalizar, sin sobrescribir guardas del servidor. El error público `503 AUTHORITY_UNAVAILABLE` también es un rechazo sin efectos y exige actualizar los metadatos; un 503 sin ese código conserva la clasificación incierta y el mismo cuerpo/UUID para reintentar. El recibo confirmado muestra insertados/revisión y enlaza `/collections/{collectionId}`; las vistas y rutas de gestión corresponden a T4, todavía no implementadas aquí.

Pruebas DOM/worker/HTTP no sustituyen la aceptación de escritorio/móvil, foco y navegación con navegador real de T5.
