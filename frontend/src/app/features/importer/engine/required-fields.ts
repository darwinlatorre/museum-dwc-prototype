import type { Profile } from '../../profiles/models/profile';
import type { Context } from '../models/context';
import type { Dataset } from '../models/dataset';
import type { Normalization } from '../models/normalization';
import { normalize } from './normalizer';

/** Header requirements use the same explicit context as record validation. */
export function requiredFields(profiles: Profile[], context: Context, blockingOnly = false): string[] {
  return [...new Set(profiles.flatMap(profile => profile.rules
    .filter(rule => (rule.kind === 'required' || rule.kind === 'requiredColumn') &&
      (!blockingOnly || rule.severity === 'ERROR') &&
      (rule.condition === 'always' || (rule.condition === 'permitAndCollection'
        ? context.permit && context.collection : context[rule.condition])))
    .map(rule => rule.field)))];
}

export interface MissingField {
  field: string;
  missing: number;
  total: number;
  columnAbsent: boolean;
}

export interface MissingCell {
  header: string;
  column: number;
  field: string;
  row: number;
  before: string;
  after: string;
}

/** Locate against source indices, never the presentation order of mapped columns. */
export function missingCells(data: Dataset, mapping: Record<string, string>, field: string, options: Normalization): MissingCell[] {
  const index = data.headers.findIndex(header => (mapping[header] || header) === field);
  if (index < 0) return [];
  const source = { headers: [data.headers[index]], rows: data.rows.map(row => ({ row: row.row, values: [row.values[index] ?? ''] })) };
  const working = normalize(source, options).data;
  return working.rows.flatMap((row, position) => !row.values[0].trim() ? [{
    header: data.headers[index], column: index + 1, field, row: row.row,
    before: source.rows[position].values[0], after: row.values[0],
  }] : []);
}

/** Count records, not profile incidences; a shared requirement counts each row once. */
export function missingFields(data: Dataset, mapping: Record<string, string>, profiles: Profile[], context: Context, options: Normalization): MissingField[] {
  const headers = data.headers.map(header => mapping[header] || header);
  const summaries = requiredFields(profiles, context).map(field => {
    const index = headers.indexOf(field);
    const needsValue = profiles.some(profile => profile.rules.some(rule =>
      rule.field === field && rule.kind === 'required' &&
      (rule.condition === 'always' || (rule.condition === 'permitAndCollection'
        ? context.permit && context.collection : context[rule.condition]))));
    return {
      field,
      missing: index < 0 ? data.rows.length : needsValue
        ? missingCells(data, mapping, field, options).length : 0,
      total: data.rows.length,
      columnAbsent: index < 0,
    };
  });
  return summaries.filter(item => item.columnAbsent || item.missing > 0)
    .sort((a, b) => b.missing - a.missing || a.field.localeCompare(b.field));
}
