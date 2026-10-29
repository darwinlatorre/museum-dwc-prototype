import type { ValidationConfiguration } from '../../record-sources/models/validation-configuration';
import type { Context } from '../models/context';
import { type Dataset, LIMITS } from '../models/dataset';
import type { Issue } from '../models/analysis-result';
import type { Term } from '../../catalog/models/catalog-term';
import { requiredFields } from './required-fields';
import { calendar, isoComponents, validIsoDate } from './normalization-dates';
import { effectiveField } from './normalization-rules';
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function suggestions(header: string, terms: Term[]): string[] {
  const needle = key(header);
  return terms
    .filter(
      (t) =>
        key(t.name) === needle ||
        (needle.length > 3 && (key(t.name).includes(needle) || needle.includes(key(t.name)))),
    )
    .slice(0, 3)
    .map((t) => t.name);
}
function coordinate(value: string, limit: number): boolean {
  return (
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) &&
    Number.isFinite(Number(value)) &&
    Math.abs(Number(value)) <= limit
  );
}
export function validate(
  data: Dataset,
  mapping: Record<string, string>,
  configuration: ValidationConfiguration,
  terms: Term[],
  context: Context,
): Issue[] {
  const headers = data.headers.map((h) => effectiveField(h, mapping));
  if (new Set(headers).size !== headers.length)
    throw new Error('Dos columnas de origen no pueden asignarse al mismo campo.');
  const issues: Issue[] = [];
  const add = (issue: Issue) => {
    if (issues.length >= LIMITS.issues)
      throw new Error(
        'Se superó el límite de incidencias (100.000). Seleccione un archivo más pequeño.',
      );
    issues.push(issue);
  };
  headers.forEach((h, i) => {
    if (!terms.some((t) => t.name === h)) {
      const proposed = suggestions(data.headers[i], terms);
      add({
        field: data.headers[i],
        row: null,
        severity: 'WARNING',
        context: 'system',
        configurationRevision: configuration.revision,
        description: `Columna desconocida.${proposed.length ? ' Posible equivalencia: ' + proposed.join(', ') + '.' : ' No se encontró una equivalencia Darwin Core.'}`,
      });
    }
  });
  for (const field of requiredFields(configuration, context)) {
    const index = headers.indexOf(field);
    const issue = (row: number | null) => add({
      field, row, description: `${field} es obligatorio en este contexto.`, severity: 'ERROR',
      context, configurationRevision: configuration.revision,
    });
    if (index < 0) issue(null);
    else for (const row of data.rows) if (!(row.values[index] ?? '').trim()) issue(row.row);
  }
  // Baseline integrity is independent of the required-field configuration.
  const base = (field: string, row: number, description: string) =>
    add({ field, row, description, severity: 'ERROR', context: 'system', configurationRevision: configuration.revision });
  for (const row of data.rows) {
    const get = (field: string) => row.values[headers.indexOf(field)] ?? '';
    for (const field of ['eventDate', 'decimalLatitude', 'decimalLongitude']) {
      const value = get(field);
      if (!value.trim()) continue;
      const valid =
        field === 'eventDate'
          ? validIsoDate(value)
          : coordinate(value, field === 'decimalLatitude' ? 90 : 180);
      if (!valid)
        base(
          field,
          row.row,
          field === 'eventDate'
            ? 'Use una fecha válida con el formato YYYY-MM-DD.'
            : `Use un número decimal finito entre ${field === 'decimalLatitude' ? '-90 y 90' : '-180 y 180'}.`,
        );
    }
    const y = get('year'),
      m = get('month'),
      d = get('day');
    for (const [field, value, max] of [
      ['year', y, 9999],
      ['month', m, 12],
      ['day', d, 31],
    ] as const) {
      if (value.trim() && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max))
        base(field, row.row, `Use un número entero para ${field} entre 1 y ${max}.`);
    }
    if (y && m && d && !calendar(Number(y), Number(m), Number(d)))
      base('day', row.row, 'El año, el mes y el día no forman una fecha válida.');
    else if (m && d && !calendar(y ? Number(y) : 2000, Number(m), Number(d)))
      base('day', row.row, 'El día no es válido para el mes seleccionado.');
    const event = get('eventDate');
    const parts = isoComponents(event);
    if (parts) {
      [y, m, d].forEach((v, i) => {
        if (parts[i] !== undefined && v.trim() && Number(v) !== parts[i])
          base(
            ['year', 'month', 'day'][i],
            row.row,
            'El componente de fecha no coincide con eventDate.',
          );
      });
    }
  }
  return issues;
}
