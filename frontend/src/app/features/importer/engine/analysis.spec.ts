import { describe, expect, it } from 'vitest';
import { parseCsv, fromMatrix } from './parser';
import { normalize } from './normalizer';
import { validate } from './validator';
import { csvReport, jsonReport } from './export';
import type { Context } from '../models/context';
import type { Profile, Rule } from '../../profiles/models/profile';
import type { Term } from '../../catalog/models/catalog-term';

const context: Context = { collection: false, permit: false, marine: false, sampling: false };
const rule = (kind: Rule['kind'] = 'required', condition: Rule['condition'] = 'always'): Rule => ({
  field: 'catalogNumber',
  kind,
  condition,
  severity: 'ERROR',
  message: 'Catalog number required',
  source: 'Museum policy',
});
const profile = (rules: Rule[], name = 'Museum'): Profile => ({
  id: name,
  name,
  version: '1.0',
  status: 'PUBLISHED',
  revision: 1,
  description: '',
  rules,
});
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
const run = (text: string, rules: Rule[] = [], ctx = context) =>
  validate(parseCsv(text), {}, [profile(rules)], terms, ctx);

describe('Spanish presentation preserves contracts and data', () => {
  it('reports exact Spanish parser errors without changing the source', () => {
    const source = 'a,a\n1,2';
    expect(() => parseCsv(source)).toThrow(
      'Los encabezados deben ser únicos y no estar vacíos (sin distinguir mayúsculas ni espacios al inicio o al final).',
    );
    expect(source).toBe('a,a\n1,2');
    expect(() => parseCsv('')).toThrow('El archivo está vacío.');
  });
  it('localizes historical seeded messages only for presentation and preserves arbitrary messages', () => {
    const seeded = {
      ...profile(
        [
          {
            ...rule(),
            message: 'catalogNumber is required for this context.',
            source: 'Museo de Historia Natural, Universidad del Cauca — requested profile 1.0',
          },
        ],
        'Museo',
      ),
      id: 'ea25b7e8-9d05-5427-8e0d-c0200785fb2d',
    };
    const before = structuredClone(seeded);
    const data = parseCsv('catalogNumber\n""');
    const issues = validate(data, {}, [seeded], terms, context);
    expect(issues).toEqual([
      {
        field: 'catalogNumber',
        row: 2,
        description: 'catalogNumber es obligatorio en este contexto.',
        severity: 'ERROR',
        profile: 'Museo',
        version: '1.0',
      },
    ]);
    expect(JSON.parse(jsonReport(issues))).toEqual(issues);
    expect(seeded).toEqual(before);
    const custom = { ...seeded, id: 'custom', name: 'My profile' };
    expect(validate(data, {}, [custom], terms, context)[0].description).toBe(
      'catalogNumber is required for this context.',
    );
    expect(run('catalogNumber\n""', [rule()])[0].description).toBe('Catalog number required');
  });
  it('uses Spanish system diagnostics with unchanged technical identifiers', () => {
    expect(run('Catalog Number\nA')[0]).toEqual({
      field: 'Catalog Number',
      row: null,
      severity: 'WARNING',
      profile: 'Sistema',
      version: '1',
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
  it('distinguishes missing columns, blank required cells and column-only rules', () => {
    expect(run('eventDate\n2024-01-01', [rule()])[0]).toMatchObject({
      row: null,
      field: 'catalogNumber',
      severity: 'ERROR',
      profile: 'Museum',
      version: '1.0',
      description: 'Catalog number required',
    });
    expect(run('catalogNumber\n""', [rule()])[0].row).toBe(2);
    expect(run('catalogNumber\n""', [rule('requiredColumn')])).toEqual([]);
    expect(run('eventDate\n2024-01-01', [rule('requiredColumn')])).toHaveLength(1);
  });
  it.each(['collection', 'permit', 'marine', 'sampling', 'permitAndCollection'] as const)(
    'honors explicit %s context',
    (condition) => {
      expect(run('catalogNumber\n""', [rule('required', condition)])).toEqual([]);
      const ctx = {
        ...context,
        [condition]: true,
        ...(condition === 'permitAndCollection' ? { permit: true, collection: true } : {}),
      };
      expect(run('catalogNumber\n""', [rule('required', condition)], ctx)).toHaveLength(1);
      if (condition === 'permitAndCollection')
        expect(
          run('catalogNumber\n""', [rule('required', condition)], { ...context, permit: true }),
        ).toEqual([]);
    },
  );
  it('retains independent profile versions and leaves source unchanged', () => {
    const data = parseCsv('catalogNumber\n""');
    const before = JSON.stringify(data);
    const result = validate(
      data,
      {},
      [profile([rule()]), { ...profile([rule()], 'SiB'), version: '4.1' }],
      terms,
      context,
    );
    expect(result.map((i) => [i.profile, i.version])).toEqual([
      ['Museum', '1.0'],
      ['SiB', '4.1'],
    ]);
    expect(JSON.stringify(data)).toBe(before);
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
  ])('rejects impossible date %s without profile date rules', (value) =>
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
      profile: 'Sistema',
      row: null,
    });
    expect(run('Catalog Number\nA')[0].description).toContain('catalogNumber');
    expect(
      validate(
        parseCsv('Catalog Number\nA'),
        { 'Catalog Number': 'catalogNumber' },
        [profile([rule()])],
        terms,
        context,
      ),
    ).toEqual([]);
    expect(() =>
      validate(
        parseCsv('a,b\nx,y'),
        { a: 'catalogNumber', b: 'catalogNumber' },
        [],
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
        profile: '@Museum',
        version: '-1',
      },
    ];
    expect(JSON.parse(jsonReport(issues))).toEqual(issues);
    const csv = csvReport(issues);
    expect(csv).toContain('field,row,description,severity,profile,version');
    expect(csv).toContain("'@Museum");
    expect(csv).toContain("'+formula");
    expect(csv).toContain("'-1");
    expect(csv).toContain("'=HYPERLINK");
    expect(issues[0].profile).toBe('@Museum');
  });
});
