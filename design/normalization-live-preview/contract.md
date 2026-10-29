# Contrato de normalización en vivo — CONGELADO

**Adoptado por el padre para T2/T3; todavía no implementado.** Deriva del contrato PROPUESTO por el agente T1, con decisiones de integración revisadas. Dirección elegida:01-hoja-ancha.html;02/03 son alternativas. Cubre S1–S8 de `odd/tasks/normalization-live-preview.md`. No cambia API, configuración global, dependencias ni exportaciones. Las tres láminas son ilustraciones locales con 36 registros sintéticos, no motor de producción ni validación TDWG completa.

## Dirección y decisión visual

Recomendada: **01-hoja-ancha.html**. La hoja, no un tablero de indicadores, es el centro de la tarea. Controles compactos, fila física anclada, encabezado doble campo DwC/original, paginación y desplazamiento horizontal dentro de la tabla. El panel de original es temporal, accesible con ratón, foco, toque y Escape. 02 reserva 268px para reglas; 03 reserva 300px para comparar textos largos. Todas usan los mismos tokens, sin sombras/fuentes/paleta nuevas. A 800px los controles se apilan; solo la hoja tiene desplazamiento horizontal.

El prototipo conserva los nombres de pasos, no implementa navegación de la aplicación. La producción debe conservar sidebar, guardas, contexto, diagnóstico y Finalizar; **no adoptar la cabecera simplificada del boceto como rediseño del shell**. Ninguna opción aplica automáticamente al diagnóstico. JSON/CSV siguen siendo informes de incidencias; no hay descarga biológica nueva.

## Propiedad única y superficies propuestas para T2/T3

Estas rutas son una propuesta de reparto futuro, no autorización de escritura en esta unidad:

- **T2 primero, único propietario motor/protocolo/worker:** `features/importer/models/normalization.ts`, nuevo `models/normalization-preview.ts`, `engine/normalizer.ts`, nuevo `engine/normalization-rules.ts` y helpers de fechas/números/duplicados si son necesarios, nuevo `engine/normalization-preview.ts`, nuevo `engine/normalization-preview.worker.ts`, `engine/required-fields.ts`, `engine/validator.ts`; ajustar `engine/analysis.worker.ts` para pasar mapping y agregar avisos de duplicados al aplicar la opción, respetando el límite vigente de incidencias. Pruebas focalizadas adyacentes y documentación de reglas a cargo del padre al autorizar esas superficies. Todos los paths se resuelven bajo `frontend/src/app/`.
- `models/worker-protocol.ts` conserva parse/validate y sus discriminantes actuales. No mezclar respuesta persistente de preview con el manejador que termina analysis.worker tras cada respuesta. T2 añade `isWorkerResponse(value: unknown): value is WorkerResponse` solo si el padre lo requiere; guard estructural, sin segundo validador de negocio.
- **T3 después, único propietario UI/integración:** `features/importer/workbench/import-workbench.ts`, `.html`, `features/importer/importer.scss` y pruebas existentes. Consume exports congelados; no reescribe protocolo ni reglas. Un solo worker persistente de preview por workbench, independiente del worker efímero de análisis.
- Ensanche adoptado: estado derivado del paso Normalizar comunicado explícitamente al shell, reutilizando output existente si lo hay. T3 puede tocar `app.ts/.html/.scss` y sus pruebas para enlazar una clase de main SOLO cuando la sección activa es análisis Y el workbench está en Normalizar. No usar selectores :has acoplados a wrappers ocultos, mutación imperativa de DOM ni duplicar estados de navegación. Solo retirar el límite1500px/márgenes necesarios en ese modo; conservar sidebar/workbench montado y geometría de catálogo/fuentes/otros pasos.

## Compatibilidad y reglas puras

Preservar exports `Normalization`, `Change`, `normalize` y resultado `{ data: Dataset; changes: Change[] }`. Nunca agregar metadata obligatoria a Change ni alterar orden fila/columna. Dos argumentos y `{ trim, emptyMarkers }` conservan exactamente trim → marcador case-insensitive, strings, filas físicas y originales. No agregar flags activados por defecto.

```ts
// models/normalization.ts — extensión compatible
export interface Normalization {
  trim: boolean;
  emptyMarkers: boolean;
  dates?: boolean;
  coordinates?: boolean;
  numbers?: boolean;
  duplicates?: boolean; // solo asesoría; nunca muta celdas
  dateOrder?: 'safe' | 'DMY' | 'MDY';
  decimalMode?: 'safe' | 'comma';
}
export type NormalizationKind = 'trim' | 'empty-marker' | 'date' | 'coordinate' | 'number';
export interface CellNormalization { after: string; kinds: NormalizationKind[] }
// engine/normalization-rules.ts
export function normalizeCell(before: string, effectiveField: string,
  options: Normalization): CellNormalization;
// engine/normalizer.ts — tercer argumento opcional
export function normalize(original: Dataset, options: Normalization,
  mapping?: Record<string, string>): { data: Dataset; changes: Change[] };
```

`effectiveField = mapping[originalHeader] || originalHeader` reutiliza exactamente el criterio de `mappedHeaders`/`required-fields`, no heurísticas del nombre de origen. `normalize` llama normalizeCell y conserva Change.field = encabezado original. `missingCells` conserva proyección de una columna y su índice físico, pero pasa `{ [header]: effectiveField }` al mismo normalize; no reimplementa trim, vacíos ni conversiones. Así una columna llamada Fecha con destino eventDate usa la misma regla en aplicación, preview y campos obligatorios. `missingFields` conserva orden y semántica actuales. No añadir duplicados a requeridos ni exigir opcionales.

Reglas adoptadas para T2:

1. `trim` y `emptyMarkers` mantienen el consentimiento existente. No limpiar interiores, traducir textos ni cambiar case. Espacios de identificadores solo se recortan si el usuario activó trim explícitamente; ceros/case jamás cambian por formato.
2. Lista inicial cerrada por significado DwC, no por apariencia: fechas `eventDate`, `dateIdentified`, `georeferencedDate`, `measurementDeterminedDate`, `modified`; coordenadas `decimalLatitude`, `decimalLongitude`; cantidades decimales `sampleSizeValue`, `minimumElevationInMeters`, `maximumElevationInMeters`, `minimumDepthInMeters`, `maximumDepthInMeters`, `minimumDistanceAboveSurfaceInMeters`, `maximumDistanceAboveSurfaceInMeters`, `coordinateUncertaintyInMeters`, `coordinatePrecision`; enteros `individualCount`, `year`, `month`, `day`, `startDayOfYear`, `endDayOfYear`. Mantener precisión/representación ya válida; no imponer una nueva semántica de unidades/rangos a cantidades generales ni alterar año0001. No convertir IDs, texto libre ni `measurementValue` (puede ser `UV-light`). No inferir tipos de rdf_type/Property. Documentar esta cobertura concreta, no anunciar coerción de todo el vocabulario.
3. En modo seguro conservar ISO válido con precisión año/mes/fecha, fecha-hora e intervalo, literalmente. Convertir solo fecha completa año/mes/día inequívoca y válida de calendario a YYYY-MM-DD (ilustración2024/02/29). `03/04/2024` no cambia en safe; DMY/MDY requieren selección explícita con ayuda, calendario y sin inventar día/zona. Fechas inválidas permanecen, no arreglar por rollover. Reutilizar el parser de fechas para que la validación básica de eventDate acepte las formas ISO comunes recomendadas (año, año-mes, fecha, fecha-hora con/sin zona e intervalos con extremos ISO), sin rechazar la copia correcta por el antiguo requisito exclusivoYYYY-MM-DD. Coherencia con year/month/day solo para componentes inequívocos, sin convertir intervalos a un día inventado. No prometer validar todas las variantes ISO8601-1:2019 ni todos los campos DwC.
4. Decimal safe acepta únicamente sintaxis inequívoca con punto, conservando texto/precisión; no necesita cambio cosmético si ya está aceptado. Comma explícito permite sustituir una coma decimal sin separadores de miles. Conservar signo, cada dígito y ceros significativos; no `Number(...).toString()`, parseFloat ni normalizar notación científica de manera implícita. `individualCount` requiere entero no negativo, nunca convertir fracción a entero. No reinterpretar `1,234` en safe. No exigir números a measurementValue.
5. Coordenadas: grados decimales; ±90/±180 inclusivos. Formatear únicamente representación decimal inequívoca (o coma con consentimiento); no convertir DMS, datum o unidades. Fuera de rango se conserva y se diagnostica. Rango puede comprobarse con comparación decimal lexical exacta; no redondear el valor almacenado. Normalización no sustituye las validaciones básicas vigentes ni certifica TDWG/SiB.

## Mensajes del worker persistente

Archivo único `models/normalization-preview.ts`. UI usa `import type`; engine no importa Angular, vistas, transporte ni TanStack. `Dataset` y `LIMITS` se reutilizan de `models/dataset.ts` (10 MiB, 50.000 filas, 500 columnas); no duplicar límites.

```ts
import type { Dataset } from './dataset';
import type { Normalization, NormalizationKind } from './normalization';
export interface PreviewToken { id: number; session: number; generation: number }
export interface PreviewWindow {
  offset: number; limit: 10 | 25 | 50 | 100;
  columnIndices: number[]; // 0..50 índices fuente distintos; vacía si todas se ocultan
}
export type PreviewRequest = PreviewToken & (
  | { kind: 'preview-init'; original: Dataset; mapping: Record<string, string>;
      options: Normalization; window: PreviewWindow }
  | { kind: 'preview-update'; options: Normalization; window: PreviewWindow }
  | { kind: 'preview-page'; window: PreviewWindow }
  | { kind: 'preview-cancel' }
);
export interface PreviewColumn {
  columnIndex: number; sourceHeader: string; effectiveField: string;
}
export interface PreviewCell {
  columnIndex: number; before: string; after: string; kinds: NormalizationKind[];
}
export interface PreviewRow {
  sourceRow: number; cells: PreviewCell[];
  equalRowGroup?: string; occurrenceIdGroup?: string;
}
export interface DuplicateGroup {
  groupId: string; sourceRows: number[]; // filas físicas, jamás índices de página
}
export interface PreviewMetadata {
  totalRows: number; totalColumns: number; changedCells: number; changedRows: number;
  changesByKind: Record<NormalizationKind, number>;
  columns: PreviewColumn[]; emptyColumnIndices: number[];
  duplicates: {
    enabled: boolean; occurrenceIdColumnIndex: number | null;
    equalRows: { groups: DuplicateGroup[]; affectedRows: number };
    occurrenceIds: { groups: DuplicateGroup[]; affectedRows: number };
  };
}
export type PreviewResponse = PreviewToken & (
  | { kind: 'preview-ready'; metadata: PreviewMetadata;
      window: PreviewWindow; rows: PreviewRow[] }
  | { kind: 'preview-page'; window: PreviewWindow; rows: PreviewRow[] }
  | { kind: 'preview-cancelled' }
  | { kind: 'preview-error'; message: string }
);
export function isPreviewResponse(value: unknown): value is PreviewResponse;
// engine/normalization-preview.ts — puros, worker es dueño de su estado
export function buildNormalizationPreview(original: Dataset,
  mapping: Record<string, string>, options: Normalization): PreviewSnapshot;
export function readPreviewPage(snapshot: PreviewSnapshot,
  window: PreviewWindow): { window: PreviewWindow; rows: PreviewRow[] };
// PreviewSnapshot privado al motor: original, copia actual, índices, metadata;
// nunca se envía íntegro a UI ni se guarda en caché de consultas.
```

`id` es único por mensaje del workbench; `session` cambia al cambiar archivo/hoja/mapeo; `generation` cambia al cambiar opciones. Init usa generación nueva. Página no cambia generación y usa id nuevo. UI acepta ready solo para sesión/generación actual y último id de cálculo; page solo para sesión/generación actual y último id de página. Un contador id global compartido evita colisiones; no reutilizar checks de `analysis.worker` como si fuera la misma sesión. El guard verifica discriminante y estructura mínima (tokens enteros, arrays, window, strings, conteos); no castear unknown sin comprobar. El worker valida rangos/presencia de init; mensajes inválidos producen error sin mutación del snapshot válido.

- Init clona original **una vez por sesión**, nunca en cada toggle/página. UI ya conserva Dataset completo; no regresarlo completo en ready. Mapping queda cacheado en worker. Update transmite solo opciones y window. Cada update parte del original cacheado, jamás de la última copia normalizada.
- Snapshot de trabajo e índices se construyen fuera del hilo principal. No construir una colección de millones de objetos Change/PreviewCell para el dataset entero: conservar valores y metadatos compactos de reglas (p.ej.bitmasks), conteos y grupos; materializar celdas solo para la ventana. Compartir filas sin cambios cuando sea seguro. `preview-ready` entrega metadata una vez por generación. `preview-page` consulta snapshot ya calculado: no renormaliza ni busca duplicados/escanea todas las columnas. Hasta100×50celdas por respuesta, no50.000×500. UI calcula índices visibles desde metadata y envía columnIndices de la ventana: ocultar vacías no produce un falso vacío de las primeras50 mientras otras tienen datos. Navegación de columnas accesible cuando exceden50; no inventar virtualización bidimensional compleja ni caché de datos enTanStack.
- EmptyColumnIndices describe la copia normalizada actual: celda vacía si `after.trim() === ''`, sin modificar su texto. NULL/N/A permanecen no vacíos sin el flag. Ocultación filtra únicamente presentación; no se envía como opción de motor. Si las vacías cambian al alternar reglas, actualizar visibilidad manteniendo índices fuente y foco de manera explícita. Filtrar la lista completa de índices fuente de metadata y seleccionar la ventana visible; **no reescanear el dataset ni cambiar la igualdad de filas**.
- Latest-only real: compute en lotes acotados y ceder al event loop con tarea, no solo microtask. Antes de publicar y entre lotes comprobar sesión/generación. Un update nuevo sustituye pendientes y cancela el trabajo anterior sin perder original. Si el cálculo puro se ofrece síncrono para pruebas pequeñas, el worker debe usar una variante por lotes que reutilice normalizeCell; no bloquear la recepción de cancel/update con 25 millones de celdas. No usar el setTimeout ilustrativo de las láminas como implementación productiva.
- Cancel termina/descarta trabajo, publica cancelled correlacionado y conserva último snapshot etiquetado anterior. Nueva acción Reintentar envía update o init si el worker fue terminado. Al cambiar archivo/hoja/mapeo, destruir worker y referencias, incrementar sesión y hacer init con original y mapeo nuevos; nunca reutilizar snapshot de otra sesión. onerror libera busy y conserva datos originales. Al destruir workbench terminar ambos workers.
- Aplicar normalización y validar captura copia de opciones + mapping + contexto + revisión de configuración, usa el pipeline existente con reglas compartidas y agrega advertencias diferenciadas de duplicados cuando la opción está activa. Reutilizar el mismo detector que preview; no mutar valores ni generar una descripción con miles de miembros repetida por cada fila (basta criterio/tamaño/primera fila). Respetar LIMITS.issues y el aviso de truncamiento existente. JSON/CSV siguen el esquema actual de incidencias, no exportan registros biológicos ni redefinen sus claves. El padre debe extender el tipo de `diagnosticOptions` para conservar todas las opciones, no solo trim/emptyMarkers. No ejecutar validación automáticamente al alternar switches. Las opciones/contexto/configuración/terms siguen invalidando resultados como hoy; eso no debe terminar el worker de preview salvo invalidez de archivo/mapeo. La preview no depende de configuración o términos de backend. Invalidar preview y resultado de validación son operaciones separadas para evitar el effect actual que llama invalidate al tocar options.
- Cambiar opciones durante validación cancela/descarta ese resultado mediante la generación existente; mientras haya cálculo actual pendiente/error no se habilita Aplicar. Distinguir carga inicial, recalculando con snapshot anterior, listo, cancelado y error; nunca mostrar "sin cambios"/"sin datos" por ausencia temporal de respuesta. Nunca publicar metadatos viejos como actuales.

## Dos criterios de duplicados

Siempre sobre la copia normalizada actual, sin eliminar ni fusionar. Filas iguales comparan **todas** las columnas en orden fuente, incluidas ocultas/no mapeadas; excluir solo identidad física de fila. Usar clave estructural sin colisión de delimitadores (JSON de strings o hash con verificación exacta). IDs: localizar destino efectivo **exacto** occurrenceID, ignorar solo blancos (`trim() === ''`); comparar después texto exacto, sin lowercasing ni equivalencia numérica. Ambas pertenencias pueden coexistir en una fila y tienen groupId de espacios distintos. Grupo de una fila no se publica.

Metadata distingue grupos y filas afectadas por criterio; no sumar como si fueran filas únicas. Desactivado = comprobación desactivada, no "0 duplicados encontrados". Columna ID ausente = ayuda "Sin occurrenceID mapeado; se comprobaron las filas completas". sourceRows incluye todas las filas físicas de cada grupo, incluso fuera de página. Se puede mostrar lista paginada en UI sin repetir cálculo. Pertenencia completa permanece en worker; ready publica grupos/memberships necesarios, como máximo dos membresías por fila. No incluir values biológicos adicionales en grupos ni otra copia del dataset.

## Contraste visual y accesibilidad a implementar

- Paginación 10/25/50/100; todas las filas alcanzables, sin insertar 50.000 filas en DOM. Índices sourceRow/columnIndex nunca dependen de orden visible.
- Campo DwC principal + encabezado original siempre, incluso cuando coinciden. Original físico anclado a izquierda; encabezados sticky en scroll interno.
- Cambios con nombre de regla, borde/superficie y conteo, nunca solo color. Antes/después exactos como texto; visualizadores ␠/⇥/↵ y ∅ no alteran Dataset ni portapapeles/datos almacenados.
- Producción: un original accesible por foco y activación/tap; hover también. Cierre con Escape y botón devuelve foco sin reabrirlo. No dialog modal para tooltip simple. Si el detalle contiene controles, usar popover/región no tooltip interactivo, aria-controls/expanded en disparador, una única instancia sin ids duplicados. Cerrar/invalidar detalle al cambiar página/opciones; no dejar original de generación vieja. Para muchas celdas preferir foco roving y entrada/salida tabular documentada; los bocetos usan botones por celda porque contienen solo 10 filas por página, no prescriben miles de paradas Tab.
- Native checkbox con role=switch y etiqueta completa, mínimo 44px de zona táctil y foco visible. No sustituir select nativo por control casero. Respetar movimiento reducido; sin animaciones de tabla.

## Cobertura y límites de esta unidad

| Spec | Propuesta verificable en artefactos | Pendiente de producción/padre |
|---|---|---|
| S1 | 3 estructuras, tokens de sistema, responsive/teclado propuestos | Elección y navegador real, auditoría geométrica/contraste |
| S2 | 36 filas alcanzables por páginas, scroll y fila fija | Worker/ventanas a límites reales; ensanche exclusivo |
| S3 | Switches apagados, reversión, antes/después y marcas de espacios | Motor tipado, off-main-thread, carreras y Apply real |
| S4 | Control duplicados y grupos con filas físicas | Algoritmo determinista completo y pruebas |
| S5 | Ocultar vacías solo visual | Índices y foco con columnas virtualizadas |
| S6 | Regla por destino y límites de L4 documentados | Parsers calendario/decimales, no validador TDWG completo |
| S7 | Igualdad de todas las columnas, independiente de ocultación | Escala/hash sin colisiones y conservación exacta |
| S8 | ID exacto separado, blancos ignorados, grupos superpuestos | Casos de ausencia de ID y conteos con pruebas públicas |

Sin RED/GREEN aplicable: documentación y HTML estático de diseño; sintaxis/estructura/paleta son verificaciones proporcionadas, no pruebas del producto. No ejecutar suites, builds, servicios ni navegador en esta unidad. El padre abrirá canvas y verificará producción posteriormente. No se investigan ni se actualizan fuentes TDWG adicionales; se usa L4 provisto.
