import { compareTableValues, type TableSortDirection } from '../../../shared/lib/table-sort';
import type { Dataset } from '../models/dataset';
import type { Normalization } from '../models/normalization';
import { isPreviewWindow, type PreviewMetadata, type PreviewWindow, type PreviewRow } from '../models/normalization-preview';
import { effectiveField, normalizeCell, normalizationKinds } from './normalization-rules';
import { duplicateGroups, type DuplicateIndex } from './normalization-duplicates';

/** Engine-owned, never postMessage this object. Values and masks, not per-cell object collections. */
export interface PreviewSnapshot {
  readonly original: Dataset;
  readonly current: Dataset;
  readonly masks: (Uint8Array | undefined)[];
  readonly changedRowIndices: readonly number[];
  readonly metadata: PreviewMetadata;
  readonly duplicates: DuplicateIndex;
}

export function* computeNormalizationPreview(original: Dataset, mapping: Record<string, string>, options: Normalization): Generator<void, PreviewSnapshot> {
  const columns = original.headers.map((sourceHeader, columnIndex) => ({ columnIndex, sourceHeader, effectiveField: effectiveField(sourceHeader, mapping) }));
  const metadata: PreviewMetadata = { totalRows: original.rows.length, totalColumns: columns.length, changedCells: 0, changedRows: 0,
    changesByKind: { trim: 0, 'empty-marker': 0, date: 0, coordinate: 0, number: 0 }, columns, emptyColumnIndices: [],
    duplicates: { enabled: false, occurrenceIdColumnIndex: null, equalRows: { groups: [], affectedRows: 0 }, occurrenceIds: { groups: [], affectedRows: 0 } } };
  const occupied = new Uint8Array(columns.length);
  const rows: Dataset['rows'] = [], masks: (Uint8Array | undefined)[] = [];
  const changedRowIndices: number[] = [];
  let work = 0;
  const physicalRows = new Set<number>();
  for (const row of original.rows) {
    if (!row || !Number.isSafeInteger(row.row) || row.row < 1 || physicalRows.has(row.row) || !Array.isArray(row.values) || row.values.length !== columns.length) throw new Error('Datos de vista previa inválidos.');
    physicalRows.add(row.row);
    let values: string[] | undefined, mask: Uint8Array | undefined;
    for (let c = 0; c < columns.length; c++) {
      const before = row.values[c];
      if (typeof before !== 'string') throw new Error('Datos de vista previa inválidos.');
      const result = normalizeCell(before, columns[c].effectiveField, options);
      if (result.after.trim()) occupied[c] = 1;
      if (result.after !== before) {
        values ??= [...row.values];
        mask ??= new Uint8Array(columns.length);
        values[c] = result.after;
        metadata.changedCells++;
        for (const kind of result.kinds) {
          mask[c] |= 1 << normalizationKinds.indexOf(kind);
          metadata.changesByKind[kind]++;
        }
      }
      if (++work % 4096 === 0) yield;
    }
    if (values) {
      changedRowIndices.push(rows.length);
      metadata.changedRows++;
    }
    rows.push(values ? { row: row.row, values } : row);
    masks.push(mask);
    // Zero-column datasets still yield by row.
    if (++work % 4096 === 0) yield;
  }
  metadata.emptyColumnIndices = columns.filter(c => !occupied[c.columnIndex]).map(c => c.columnIndex);
  const current = { headers: original.headers, rows };
  const duplicates = yield* duplicateGroups(current, mapping, !!options.duplicates);
  metadata.duplicates = duplicates.metadata;
  return { original, current, masks, changedRowIndices, metadata, duplicates };
}

/** Convenient synchronous API for small pure tests; worker uses the incremental iterator instead. */
export function buildNormalizationPreview(original: Dataset, mapping: Record<string, string>, options: Normalization): PreviewSnapshot {
  const computation = computeNormalizationPreview(original, mapping, options);
  let step = computation.next();
  while (!step.done) step = computation.next();
  return step.value;
}

/** One selected column per snapshot; bounded cache never crosses the worker boundary. */
const sortCache = new WeakMap<PreviewSnapshot, {
  columnIndex: number | null;
  keys: (string | number)[];
  orders: Partial<Record<`${TableSortDirection}:${'all' | 'changed'}`, readonly number[]>>;
}>();
function orderedIndices(snapshot: PreviewSnapshot, window: PreviewWindow): readonly number[] {
  const columnIndex = window.sort?.columnIndex ?? null;
  let cache = sortCache.get(snapshot);
  if (!cache || cache.columnIndex !== columnIndex) {
    cache = { columnIndex, keys: snapshot.current.rows.map(row => columnIndex === null ? row.row : row.values[columnIndex]), orders: {} };
    sortCache.set(snapshot, cache);
  }
  const direction = window.sort?.direction ?? 'asc';
  const key = `${direction}:${window.rowFilter ?? 'all'}` as const;
  if (!cache.orders[key]) {
    const allKey = `${direction}:all` as const;
    cache.orders[allKey] ??= cache.keys.map((_, index) => index).sort((a, b) =>
      compareTableValues(cache.keys[a], cache.keys[b], direction) || a - b);
    const changed = new Set(snapshot.changedRowIndices);
    cache.orders[key] = window.rowFilter === 'changed' ? cache.orders[allKey].filter(index => changed.has(index)) : cache.orders[allKey];
  }
  return cache.orders[key]!;
}

export function readPreviewPage(snapshot: PreviewSnapshot, window: PreviewWindow): { window: PreviewWindow; rows: PreviewRow[] } {
  if (!isPreviewWindow(window)) throw new Error('Ventana de vista previa inválida.');
  const changed = window.rowFilter === 'changed';
  const total = changed ? snapshot.metadata.changedRows : snapshot.metadata.totalRows;
  if (window.offset > total || window.columnIndices.some(c => c >= snapshot.metadata.totalColumns) ||
    (window.sort?.columnIndex != null && window.sort.columnIndex >= snapshot.metadata.totalColumns)) throw new Error('Ventana de vista previa inválida.');
  const indices = orderedIndices(snapshot, window);
  const rows: PreviewRow[] = [];
  for (let position = window.offset; position < Math.min(window.offset + window.limit, total); position++) {
    const r = indices[position];
    const sourceRow = snapshot.original.rows[r].row;
    const equalRowGroup = snapshot.duplicates.equalMembership.get(sourceRow);
    const occurrenceIdGroup = snapshot.duplicates.idMembership.get(sourceRow);
    rows.push({ sourceRow, cells: window.columnIndices.map(columnIndex => ({ columnIndex,
      before: snapshot.original.rows[r].values[columnIndex], after: snapshot.current.rows[r].values[columnIndex],
      kinds: normalizationKinds.filter((_, k) => ((snapshot.masks[r]?.[columnIndex] ?? 0) & (1 << k)) !== 0),
    })), ...(equalRowGroup ? { equalRowGroup } : {}), ...(occurrenceIdGroup ? { occurrenceIdGroup } : {}) });
  }
  return { window: { ...window, columnIndices: [...window.columnIndices], ...(window.sort ? { sort: { ...window.sort } } : {}) }, rows };
}
