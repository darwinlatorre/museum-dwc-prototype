import type { Dataset } from './dataset';
import type { Normalization, NormalizationKind } from './normalization';
export interface PreviewToken { id: number; session: number; generation: number }
export interface PreviewWindow { offset: number; limit: 10 | 25 | 50 | 100; columnIndices: number[]; rowFilter?: 'all' | 'changed' }
export type PreviewRequest = PreviewToken & (
  | { kind: 'preview-init'; original: Dataset; mapping: Record<string, string>; options: Normalization; window: PreviewWindow }
  | { kind: 'preview-update'; options: Normalization; window: PreviewWindow }
  | { kind: 'preview-page'; window: PreviewWindow }
  | { kind: 'preview-cancel' }
);
export interface PreviewColumn { columnIndex: number; sourceHeader: string; effectiveField: string }
export interface PreviewCell { columnIndex: number; before: string; after: string; kinds: NormalizationKind[] }
export interface PreviewRow { sourceRow: number; cells: PreviewCell[]; equalRowGroup?: string; occurrenceIdGroup?: string }
export interface DuplicateGroup { groupId: string; sourceRows: number[] }
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
  | { kind: 'preview-ready'; metadata: PreviewMetadata; window: PreviewWindow; rows: PreviewRow[] }
  | { kind: 'preview-page'; window: PreviewWindow; rows: PreviewRow[] }
  | { kind: 'preview-cancelled' }
  | { kind: 'preview-error'; message: string }
);
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const kinds: NormalizationKind[] = ['trim', 'empty-marker', 'date', 'coordinate', 'number'];
export function isPreviewToken(value: unknown): value is PreviewToken {
  return object(value) && count(value['id']) && count(value['session']) && count(value['generation']);
}
export function isPreviewWindow(value: unknown): value is PreviewWindow {
  return object(value) && count(value['offset']) && [10, 25, 50, 100].some(limit => limit === value['limit']) &&
    (value['rowFilter'] === undefined || value['rowFilter'] === 'all' || value['rowFilter'] === 'changed') &&
    Array.isArray(value['columnIndices']) && value['columnIndices'].length <= 50 && value['columnIndices'].every(count) && new Set(value['columnIndices']).size === value['columnIndices'].length;
}
function groups(value: unknown): boolean {
  return object(value) && count(value['affectedRows']) && Array.isArray(value['groups']) && value['groups'].every(group =>
    object(group) && typeof group['groupId'] === 'string' && Array.isArray(group['sourceRows']) && group['sourceRows'].length > 1 && group['sourceRows'].every(count));
}
function metadata(value: unknown): value is PreviewMetadata {
  if (!object(value) || !count(value['totalRows']) || !count(value['totalColumns']) || !count(value['changedCells']) || !count(value['changedRows'])) return false;
  const changes = value['changesByKind'], duplicates = value['duplicates'];
  return object(changes) && kinds.every(kind => count(changes[kind])) && Array.isArray(value['columns']) &&
    value['columns'].length === value['totalColumns'] && value['columns'].every(column => object(column) && count(column['columnIndex']) && typeof column['sourceHeader'] === 'string' && typeof column['effectiveField'] === 'string') &&
    Array.isArray(value['emptyColumnIndices']) && value['emptyColumnIndices'].every(count) && object(duplicates) && typeof duplicates['enabled'] === 'boolean' &&
    (duplicates['occurrenceIdColumnIndex'] === null || count(duplicates['occurrenceIdColumnIndex'])) && groups(duplicates['equalRows']) && groups(duplicates['occurrenceIds']);
}
export function isPreviewResponse(value: unknown): value is PreviewResponse {
  if (!object(value) || !isPreviewToken(value)) return false;
  if (value['kind'] === 'preview-error') return typeof value['message'] === 'string';
  if (value['kind'] === 'preview-cancelled') return true;
  if (value['kind'] !== 'preview-ready' && value['kind'] !== 'preview-page') return false;
  if (!isPreviewWindow(value['window'])) return false;
  const window = value['window'];
  return Array.isArray(value['rows']) && value['rows'].length <= window.limit && value['rows'].every(row => object(row) && count(row['sourceRow']) &&
    (row['equalRowGroup'] === undefined || typeof row['equalRowGroup'] === 'string') && (row['occurrenceIdGroup'] === undefined || typeof row['occurrenceIdGroup'] === 'string') &&
    Array.isArray(row['cells']) && row['cells'].length === window.columnIndices.length && row['cells'].every((cell, i) => object(cell) && cell['columnIndex'] === window.columnIndices[i] &&
      typeof cell['before'] === 'string' && typeof cell['after'] === 'string' && Array.isArray(cell['kinds']) && cell['kinds'].every(kind => kinds.some(known => known === kind)))) &&
    (value['kind'] === 'preview-page' || metadata(value['metadata']));
}
