import type { CellNormalization, Normalization, NormalizationKind } from '../models/normalization';
import { normalizeDate } from './normalization-dates';

const dates = new Set(['eventDate', 'dateIdentified', 'georeferencedDate', 'measurementDeterminedDate', 'modified']);
const decimals = new Set(['sampleSizeValue', 'minimumElevationInMeters', 'maximumElevationInMeters',
  'minimumDepthInMeters', 'maximumDepthInMeters', 'minimumDistanceAboveSurfaceInMeters',
  'maximumDistanceAboveSurfaceInMeters', 'coordinateUncertaintyInMeters', 'coordinatePrecision']);
const integers = new Set(['individualCount', 'year', 'month', 'day', 'startDayOfYear', 'endDayOfYear']);
export const normalizationKinds: NormalizationKind[] = ['trim', 'empty-marker', 'date', 'coordinate', 'number'];

/** Preserve legacy truthy fallback, but never read inherited Object.prototype properties. */
export function effectiveField(header: string, mapping?: Record<string, string>): string {
  return mapping && Object.prototype.hasOwnProperty.call(mapping, header) && typeof mapping[header] === 'string' && mapping[header] ? mapping[header] : header;
}

export function decimalWithin(value: string, limit: number): boolean {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return false;
  const [whole, fraction = ''] = value.replace(/^[+-]/, '').split('.');
  const digits = whole.replace(/^0+/, '') || '0';
  const bound = String(limit);
  return digits.length < bound.length || (digits.length === bound.length &&
    (digits < bound || (digits === bound && !/[1-9]/.test(fraction))));
}

export function normalizeCell(before: string, field: string, options: Normalization): CellNormalization {
  let after = before;
  const kinds: NormalizationKind[] = [];
  const apply = (next: string, kind: NormalizationKind) => {
    if (next !== after) { after = next; kinds.push(kind); }
  };
  if (options.trim) apply(after.trim(), 'trim');
  if (options.emptyMarkers && /^(null|n\/a)$/i.test(after)) apply('', 'empty-marker');
  if (options.dates && dates.has(field)) apply(normalizeDate(after, options.dateOrder), 'date');
  const coordinate = field === 'decimalLatitude' || field === 'decimalLongitude';
  if ((options.coordinates && coordinate) || (options.numbers && (decimals.has(field) || integers.has(field)))) {
    const candidate = options.decimalMode === 'comma' && /^[+-]?\d+,\d+$/.test(after) ? after.replace(',', '.') : after;
    if (coordinate) {
      if (decimalWithin(candidate, field === 'decimalLatitude' ? 90 : 180)) apply(candidate, 'coordinate');
    } else if (decimals.has(field) && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(candidate)) apply(candidate, 'number');
    // Integers already in the accepted literal form need no cosmetic rewrite. Never turn fractions into integers.
  }
  return { after, kinds };
}
