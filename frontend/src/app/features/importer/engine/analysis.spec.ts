import { describe, expect, it } from 'vitest';
import { parseCsv, fromMatrix } from './parser';
import { normalize } from './normalizer';
import { validate } from './validator';
import { csvReport, jsonReport } from './export';
import { configurationFixture, contextKeys, requiredSets } from '../../../testing/validation-fixture';
import type { Term } from '../../catalog/models/catalog-term';

const context = 'other' as const;
const terms: Term[] = [
  'catalogNumber',
  'eventDate',
  'year',
  'month',
  'day',
  'decimalLatitude',
  'decimalLongitude',
].map((name) => ({
  name,
  uri: 'https://example.org/' + name,
  definition: name,
  category: 'Record',
  status: 'recommended',
}));
const run = (text: string, fields: string[] = []) =>
  validate(parseCsv(text), {}, configurationFixture(fields), terms, context);

describe('Spanish presentation preserves contracts and data', () => {
  it('reports exact Spanish parser errors without changing the source', () => {
    const source = 'a,a\n1,2';
    expect(() => parseCsv(source)).toThrow(
      'Los encabezados deben ser únicos y no estar vacíos (sin distinguir mayúsculas ni espacios al inicio o al final).',
    );
    expect(source).toBe('a,a\n1,2');
    expect(() => parseCsv('')).toThrow('El archivo está vacío.');
  });
  it('conserva el contexto, la revisión real y textos de campos arbitrarios sin cambiar el snapshot', () => {
    const config = configurationFixture(['  campo libre  ']);
    const before = structuredClone(config);
    const issues = validate(parseCsv('catalogNumber\nA'), {}, config, terms, context);
    expect(issues).toEqual([{ field: '  campo libre  ', row: null,
      description: '  campo libre   es obligatorio en este contexto.', severity: 'ERROR',
      context: 'other', configurationRevision: 7 }]);
    expect(JSON.parse(jsonReport(issues))).toEqual(issues);
    expect(config).toEqual(before);
    expect(issues[0]).not.toHaveProperty('profile');
    expect(issues[0]).not.toHaveProperty('version');
  });
  it('uses Spanish system diagnostics with unchanged technical identifiers', () => {
    expect(run('Catalog Number\nA')[0]).toEqual({
      field: 'Catalog Number',
      row: null,
      severity: 'WARNING',
      context: 'system',
      configurationRevision: 7,
      description: 'Columna desconocida. Posible equivalencia: catalogNumber.',
    });
    expect(run('eventDate\n2023-02-29')[0].description).toBe(
      'Use una fecha válida con el formato YYYY-MM-DD.',
    );
  });
});

describe('local parser', () => {
  it('preserves quotes, embedded newlines, blank source lines and physical row numbers', () => {
    expect(parseCsv('catalogNumber,note\r\n\r\n"A,1","line\n""two"""\r\nB,end')).toEqual({
      headers: ['catalogNumber', 'note'],
      rows: [
        { row: 3, values: ['A,1', 'line\n"two"'] },
        { row: 5, values: ['B', 'end'] },
      ],
    });
  });
  it.each([
    'a,a\n1,2',
    'a, A\n1,2',
    ',b\n1,2',
    'a,b\n1',
    'a\n"unclosed',
    'a\nx"y',
    'a\n"x"junk',
    '',
  ])('rejects malformed input %j', (text) => expect(() => parseCsv(text)).toThrow());
  it('rejects duplicate spreadsheet headers and over-wide rows without mutating source', () => {
    const matrix = [
      ['a', 'a'],
      ['x', 'y'],
    ];
    const before = JSON.stringify(matrix);
    expect(() => fromMatrix(matrix)).toThrow();
    expect(JSON.stringify(matrix)).toBe(before);
    expect(() => fromMatrix([['a'], ['x', 'y']])).toThrow();
  });
});
describe('controlled normalization', () => {
  it('requires explicit opt-in and never changes originals', () => {
    const original = parseCsv('catalogNumber\n"  AbC  "');
    const before = JSON.stringify(original);
    expect(normalize(original, { trim: false, emptyMarkers: false }).data).toEqual(original);
    const result = normalize(original, { trim: true, emptyMarkers: true });
    expect(result.data.rows[0].values).toEqual(['AbC']);
    expect(result.changes).toEqual([
      { row: 2, field: 'catalogNumber', before: '  AbC  ', after: 'AbC' },
    ]);
    expect(JSON.stringify(original)).toBe(before);
    expect(
      normalize(parseCsv('a\nNULL'), { trim: false, emptyMarkers: true }).data.rows[0].values,
    ).toEqual(['']);
  });
});
describe('validation', () => {
  it('distinguishes missing columns from blank cells and leaves source unchanged', () => {
    expect(run('eventDate\n2024-01-01', ['catalogNumber'])).toEqual([{
      row: null, field: 'catalogNumber', severity: 'ERROR', context: 'other', configurationRevision: 7,
      description: 'catalogNumber es obligatorio en este contexto.',
    }]);
    const data = parseCsv('catalogNumber\n\n""');
    const before = JSON.stringify(data);
    expect(validate(data, {}, configurationFixture(['catalogNumber']), terms, context)).toEqual([{
      field: 'catalogNumber', row: 3, description: 'catalogNumber es obligatorio en este contexto.',
      severity: 'ERROR', context: 'other', configurationRevision: 7,
    }]);
    expect(JSON.stringify(data)).toBe(before);
  });
  it.each(contextKeys)('diagnostica exactamente los requisitos de %s sin contarlos dos veces', selected => {
    const config = configurationFixture();
    const issues = validate({ headers: [], rows: [] }, {}, config, terms, selected);
    expect(issues.map(issue => issue.field)).toEqual(requiredSets[selected]);
    expect(issues.every(issue => issue.context === selected && issue.configurationRevision === 7 && issue.row === null)).toBe(true);
  });
  it.each([
    '2023-02-29',
    '1900-02-29',
    '2024-04-31',
    '2024-13-01',
    '2024-00-01',
    '2024-01-00',
    '0000-01-01',
    '2024-1-1',
    'not a date',
  ])('rejects impossible date %s independently of required fields', (value) =>
    expect(run('eventDate\n' + value)).toHaveLength(1),
  );
  it.each(['2024-02-29', '2000-02-29', '2024-12-31'])('accepts calendar date %s', (value) =>
    expect(run('eventDate\n' + value)).toEqual([]),
  );
  it.each(['2023,2,29', '2024,4,31', '2024,13,1', '0,1,1', '2024,1.5,1', '2024,1,32'])(
    'checks date components %s',
    (value) => expect(run('year,month,day\n' + value).length).toBeGreaterThan(0),
  );
  it('accepts leap components and rejects inconsistent date/components', () => {
    expect(run('year,month,day\n2000,2,29')).toEqual([]);
    expect(run('eventDate,year,month,day\n2024-02-29,2023,2,28').length).toBeGreaterThan(0);
  });
  it.each(['90,180', '-90,-180', '0,0'])('accepts coordinate boundary %s', (value) =>
    expect(run('decimalLatitude,decimalLongitude\n' + value)).toEqual([]),
  );
  it.each(['90.1,0', '0,-180.1', 'Infinity,0', 'NaN,0', '1x,0', '0x10,0'])(
    'rejects nonfinite/nondecimal/out-of-range coordinates %s',
    (value) => expect(run('decimalLatitude,decimalLongitude\n' + value)).toHaveLength(1),
  );
  it('reports unknown columns with suggestions and honors explicit mapping', () => {
    expect(run('Catalog Number\nA')[0]).toMatchObject({
      field: 'Catalog Number',
      severity: 'WARNING',
      context: 'system',
      configurationRevision: 7,
      row: null,
    });
    expect(run('Catalog Number\nA')[0].description).toContain('catalogNumber');
    expect(
      validate(
        parseCsv('Catalog Number\nA'),
        { 'Catalog Number': 'catalogNumber' },
        configurationFixture(['catalogNumber']),
        terms,
        context,
      ),
    ).toEqual([]);
    expect(() =>
      validate(
        parseCsv('a,b\nx,y'),
        { a: 'catalogNumber', b: 'catalogNumber' },
        configurationFixture([]),
        terms,
        context,
      ),
    ).toThrow();
  });
});
describe('download reports', () => {
  it('exports all provenance and neutralizes spreadsheet formula cells', () => {
    const issues = [
      {
        field: '=HYPERLINK("x")',
        row: 2,
        description: '+formula',
        severity: 'WARNING' as const,
        context: 'other' as const,
        configurationRevision: 57,
      },
    ];
    expect(JSON.parse(jsonReport(issues))).toEqual(issues);
    const csv = csvReport(issues);
    expect(csv).toContain('field,row,description,severity,context,configurationRevision');
    expect(csv).toContain('"other","57"');
    expect(csv).toContain("'+formula");
    expect(csv).toContain("'=HYPERLINK");
    expect(issues[0].field).toBe('=HYPERLINK("x")');
  });
});
