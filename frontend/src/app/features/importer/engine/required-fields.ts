import type { ValidationConfiguration } from '../../validation-configuration/models/validation-configuration';
import type { Context } from '../models/context';
import type { Dataset } from '../models/dataset';
import type { Normalization } from '../models/normalization';
import { normalize } from './normalizer';

/** No defaults: only the selected context of the server snapshot is authoritative. */
export function requiredFields(configuration: ValidationConfiguration, context: Context): string[] {
  const requirements = configuration.contexts.find(item => item.context === context);
  if (!requirements) throw new Error('La configuración no contiene el contexto seleccionado. Actualice los datos.');
  return requirements.requiredFields;
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

/** Count each source record once per configured field. */
export function missingFields(data: Dataset, mapping: Record<string, string>, configuration: ValidationConfiguration, context: Context, options: Normalization): MissingField[] {
  const headers = data.headers.map(header => mapping[header] || header);
  const summaries = requiredFields(configuration, context).map(field => ({
    field,
    missing: headers.includes(field) ? missingCells(data, mapping, field, options).length : data.rows.length,
    total: data.rows.length,
    columnAbsent: !headers.includes(field),
  }));
  return summaries.filter(item => item.columnAbsent || item.missing > 0)
    .sort((a, b) => b.missing - a.missing || a.field.localeCompare(b.field));
}
