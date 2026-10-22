import { Condition, Context, Dataset, Issue, LIMITS, Profile, Term } from './model';
import { ruleMessage } from '../localization';
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
function active(condition: Condition, context: Context): boolean {
  return (
    condition === 'always' ||
    (condition === 'permitAndCollection'
      ? context.permit && context.collection
      : context[condition])
  );
}
function calendar(y: number, m: number, d: number): boolean {
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return (
    Number.isInteger(y) &&
    y >= 1 &&
    y <= 9999 &&
    Number.isInteger(m) &&
    m >= 1 &&
    m <= 12 &&
    Number.isInteger(d) &&
    d >= 1 &&
    d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
  );
}
function date(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  return calendar(y, m, d);
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
  profiles: Profile[],
  terms: Term[],
  context: Context,
): Issue[] {
  const headers = data.headers.map((h) => mapping[h] || h);
  if (new Set(headers).size !== headers.length)
    throw new Error('Dos columnas de origen no pueden asignarse al mismo campo.');
  const issues: Issue[] = [];
  const add = (issue: Issue) => {
    if (issues.length >= LIMITS.issues)
      throw new Error(
        'Se superó el límite de incidencias (100.000). Seleccione menos perfiles o un archivo más pequeño.',
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
        profile: 'Sistema',
        version: '1',
        description: `Columna desconocida.${proposed.length ? ' Posible equivalencia: ' + proposed.join(', ') + '.' : ' No se encontró una equivalencia Darwin Core.'}`,
      });
    }
  });
  for (const profile of profiles)
    for (const rule of profile.rules) {
      if (!active(rule.condition, context)) continue;
      const index = headers.indexOf(rule.field);
      const issue = (row: number | null) =>
        add({
          field: rule.field,
          row,
          description: ruleMessage(profile, rule) || `Valor no válido para ${rule.field}.`,
          severity: rule.severity,
          profile: profile.name,
          version: profile.version,
        });
      if (index < 0) {
        if (rule.kind === 'required' || rule.kind === 'requiredColumn') issue(null);
        continue;
      }
      for (const row of data.rows) {
        const value = row.values[index];
        const blank = !value.trim();
        if (rule.kind === 'required' && blank) issue(row.row);
        else if (
          !blank &&
          ((rule.kind === 'date' && !date(value)) ||
            (rule.kind === 'latitude' && !coordinate(value, 90)) ||
            (rule.kind === 'longitude' && !coordinate(value, 180)))
        )
          issue(row.row);
      }
    }
  // Baseline integrity is independent of optional profile rules.
  const base = (field: string, row: number, description: string) =>
    add({ field, row, description, severity: 'ERROR', profile: 'Sistema', version: '1' });
  for (const row of data.rows) {
    const get = (field: string) => row.values[headers.indexOf(field)] ?? '';
    for (const field of ['eventDate', 'decimalLatitude', 'decimalLongitude']) {
      const value = get(field);
      if (!value.trim()) continue;
      const valid =
        field === 'eventDate'
          ? date(value)
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
    if (event && date(event)) {
      const parts = event.split('-').map(Number);
      [y, m, d].forEach((v, i) => {
        if (v.trim() && Number(v) !== parts[i])
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
