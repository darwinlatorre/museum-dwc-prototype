# Motor de normalización local

La normalización crea una copia reversible **desde el original**, nunca desde la copia anterior. No envía datos al servidor. Esta documentación cubre el motor; los controles y su aceptación visual corresponden a la integración del workbench.

## Uso y compatibilidad

`normalize(original, options, mapping?)` conserva `{ data, changes }`. `Change` sigue teniendo exclusivamente `row`, `field`, `before`, `after`, en orden fila/columna; `field` es el encabezado original. Los llamadores de dos argumentos y `{ trim, emptyMarkers }` mantienen el resultado anterior. Todos los flags nuevos son opcionales y apagados por defecto.

`normalizeCell(before, effectiveField, options)` es la regla compartida entre aplicación, preview y proyección de requeridos. El destino se resuelve por propiedad **propia** de mapping con fallback al encabezado literal: no se traducen nombres ni se infieren tipos de `rdf_type`. `toString` y `__proto__` no consultan propiedades heredadas. Encabezados, valores, filas físicas y originales no se modifican.

## Reglas y consentimiento

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

Contrato tipado: `models/normalization-preview.ts`; worker: `engine/normalization-preview.worker.ts`. Es **independiente** del worker efímero `analysis.worker.ts`, cuyo protocolo parse/validate no cambia.

1. Crear un worker módulo relativo al workbench y enviar `preview-init` con original, mapping, opciones y ventana. El clon recibido por postMessage se conserva una vez en el worker. Cambiar archivo/hoja/mapeo exige nueva sesión; terminar el worker anterior al descartar el workbench.
2. Cada cambio de opciones envía `preview-update` sin dataset/mapping, con generación creciente. Toda actualización parte del original cacheado. Un cálculo nuevo sustituye al pendiente; no se publica una respuesta del cálculo sustituido.
3. `preview-ready` entrega metadata completa y una ventana; `preview-page` solo entrega la ventana solicitada del snapshot ya calculado. No vuelve a normalizar, detectar duplicados ni recorrer datos fuera de esa página.
4. Ventanas: offset entre0 y totalRows, límites10/25/50/100 y hasta50 índices fuente distintos, no necesariamente contiguos. `columnIndices: []` es válido. Usar `metadata.columns` y `emptyColumnIndices` completos para seleccionar columnas visibles, no solo las primeras50. Una columna es vacía si todos los valores actuales cumplen `after.trim() === ''`.
5. `id` único global por mensaje, `session` creciente por original/mapping y `generation` creciente por opciones. Verificar `isPreviewResponse(unknown)` antes de usar respuestas; aceptar ready/page únicamente para tokens e id actuales del consumidor. Error conserva tokens válidos; token malformado devuelve0/0/0. Nunca tratar un error como una página vacía.
6. Cancel envía `preview-cancel` para la generación actual y recibe `preview-cancelled`. Conserva el último snapshot con **sus tokens anteriores**; sus páginas solo pueden solicitarse con esa generación. Reintentar usa update con generación nueva. Una sesión nueva no permite páginas de otra sesión. Error de compute conserva el último snapshot válido.

El cálculo usa un generador compartido y tareas de event loop entre lotes acotados (no solo microtasks). Almacena valores, máscaras compactas por fila cambiada y conteos; comparte filas sin cambios. Solo materializa `PreviewCell` para la ventana. El snapshot completo nunca cruza postMessage ni va a Query/cache. El helper síncrono `buildNormalizationPreview` es para pequeños consumidores puros/pruebas; no llamarlo desde la UI para datasets grandes.

## Duplicados y Aplicar

- Filas completas: clave estructural JSON de todas las celdas en orden fuente, incluidas ocultas/no mapeadas; excluye solo identidad física.
- IDs: destino exacto `occurrenceID`; omite blancos pero compara el texto actual exacto. Case y ceros distinguen IDs. Un ID repetido puede tener otras celdas distintas.
- Los grupos tienen más de un miembro, namespaces `row:` e `id:`, todas las filas físicas (incluso fuera de página) y conteos separados. Una fila puede pertenecer a ambos criterios. No sumar afectados como si fueran filas únicas.
- `enabled: false` significa no comprobado. `occurrenceIdColumnIndex: null` permite informar «Sin occurrenceID mapeado; se comprobaron las filas completas» sin desactivar el criterio de fila.
- Aplicar usa el mismo detector y añade WARNING por miembro/criterio con tamaño y primera fila, no listas gigantes repetidas. Conserva claves y límite `LIMITS.issues` del informe JSON/CSV; superar100.000 produce el mismo error existente, no un resultado parcial. Los informes siguen siendo diagnósticos, no exportaciones biológicas.

La integración debe conservar **todas** las opciones en diagnosticOptions, capturar mapping/contexto/revisión al aplicar y mantener separadas las invalidaciones de preview y diagnóstico. No ejecutar validación automáticamente al mover switches. La gestión de busy, foco, detalle original y errores del navegador pertenece a T3/T4.
