import { LIMITS, type Dataset } from '../models/dataset';
import type { Normalization } from '../models/normalization';
import { isPreviewToken, isPreviewWindow, type PreviewRequest, type PreviewToken } from '../models/normalization-preview';

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export function validOptions(value: unknown): value is Normalization {
  return object(value) && typeof value['trim'] === 'boolean' && typeof value['emptyMarkers'] === 'boolean' &&
    ['dates', 'coordinates', 'numbers', 'duplicates'].every(key => value[key] === undefined || typeof value[key] === 'boolean') &&
    (value['dateOrder'] === undefined || ['safe', 'DMY', 'MDY'].some(order => order === value['dateOrder'])) &&
    (value['decimalMode'] === undefined || value['decimalMode'] === 'safe' || value['decimalMode'] === 'comma');
}
/** Row contents are checked incrementally during compute, not in a second blocking scan. */
function datasetShape(value: unknown): value is Dataset {
  return object(value) && Array.isArray(value['headers']) && value['headers'].length <= LIMITS.columns && value['headers'].every(header => typeof header === 'string') &&
    Array.isArray(value['rows']) && value['rows'].length <= LIMITS.rows;
}
export function previewRequest(value: unknown): PreviewRequest {
  if (!object(value) || !isPreviewToken(value)) throw new Error('Mensaje de vista previa inválido.');
  const token = { id: value.id, session: value.session, generation: value.generation };
  if (value['kind'] === 'preview-cancel') return { ...token, kind: 'preview-cancel' };
  const window = value['window'];
  if (!isPreviewWindow(window)) throw new Error('Ventana de vista previa inválida.');
  if (value['kind'] === 'preview-page') return { ...token, kind: 'preview-page', window };
  const options = value['options'];
  if (!validOptions(options)) throw new Error('Opciones de normalización inválidas.');
  if (value['kind'] === 'preview-update') return { ...token, kind: 'preview-update', window, options };
  const original = value['original'], mapping = value['mapping'];
  if (value['kind'] !== 'preview-init' || !datasetShape(original) || !object(mapping) || !Object.values(mapping).every(field => typeof field === 'string')) throw new Error('Datos de vista previa inválidos.');
  return { ...token, kind: 'preview-init', window, options, original, mapping: mapping as Record<string, string> };
}
export function errorToken(value: unknown): PreviewToken {
  // A malformed token has no valid correlation; use deterministic sentinels, never echo arbitrary payloads.
  return isPreviewToken(value) ? { id: value.id, session: value.session, generation: value.generation } : { id: 0, session: 0, generation: 0 };
}
