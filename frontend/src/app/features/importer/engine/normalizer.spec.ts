import { describe, expect, it } from 'vitest';
import { normalize } from './normalizer';
import { buildNormalizationPreview, readPreviewPage } from './normalization-preview';
import { isPreviewResponse } from '../models/normalization-preview';
import { validate } from './validator';
import { missingCells } from './required-fields';
import { configurationFixture } from '../../../testing/validation-fixture';
import type { Normalization } from '../models/normalization';
import type { Dataset } from '../models/dataset';
const off: Normalization = { trim: false, emptyMarkers: false };
const data = (headers: string[], rows: string[][]): Dataset => ({ headers, rows: rows.map((values, i) => ({ row: i * 3 + 2, values })) });
const cell = (value: string, field: string, options: Normalization) => normalize(data([field], [[value]]), options).data.rows[0].values[0];
const page = { offset: 0, limit: 25 as const, columnIndices: [0] };

describe('reglas DwC opt-in y compatibilidad literal', () => {
  it.each([[false, false], [false, true], [true, false], [true, true]])('conserva trim=%s y marcadores=%s, Change exacto ordenado', (trim, emptyMarkers) => {
    const original = data(['literal', 'id'], [[' NULL ', ' N/A '], ['null', ' 001A ']]);
    const before = structuredClone(original);
    const expected = original.rows.map(row => row.values.map(value => {
      const trimmed = trim ? value.trim() : value;
      return emptyMarkers && /^(null|n\/a)$/i.test(trimmed) ? '' : trimmed;
    }));
    const result = normalize(original, { trim, emptyMarkers });
    expect(result.data.rows.map(row => row.values)).toEqual(expected);
    expect(result.changes).toEqual(original.rows.flatMap((row, r) => row.values.flatMap((value, c) => value === expected[r][c] ? [] : [{ row: row.row, field: original.headers[c], before: value, after: expected[r][c] }])));
    expect(original).toEqual(before);
  });
  it('normaliza fechas por destino sin tocar original, IDs, desconocidos o verbatim', () => {
    const original = data(['Fecha', 'occurrenceID', 'measurementValue', 'verbatimEventDate', 'x'], [['2024/02/29', '0001', 'UV-light', '2024/02/29', '2024/02/29']]);
    const before = structuredClone(original);
    const snapshot = buildNormalizationPreview(original, { Fecha: 'eventDate' }, { ...off, dates: true });
    expect(readPreviewPage(snapshot, { ...page, columnIndices: [0, 1, 2, 3, 4] }).rows[0].cells.map(c => c.after)).toEqual(['2024-02-29', '0001', 'UV-light', '2024/02/29', '2024/02/29']);
    expect(snapshot.metadata.changedCells).toBe(1);
    expect(snapshot.metadata.changesByKind.date).toBe(1);
    expect(original).toEqual(before);
  });
  it.each(['eventDate', 'dateIdentified', 'georeferencedDate', 'measurementDeterminedDate', 'modified'])('registra fecha común %s', field => {
    expect(cell('0001/01/02', field, { ...off, dates: true })).toBe('0001-01-02');
  });
  it('no adivina fechas ambiguas, calendario, precisión ni zona', () => {
    const options = { ...off, dates: true };
    for (const value of ['03/04/2024', '2023/02/29', '1900/02/29', '2024/04/31', '0000/01/01', '2024', '2024-02', '2024-02-29T12:34:56Z', '2024-01/2024-02']) expect(cell(value, 'eventDate', options)).toBe(value);
    expect(cell('03/04/2024', 'eventDate', { ...options, dateOrder: 'DMY' })).toBe('2024-04-03');
    expect(cell('03/04/2024', 'eventDate', { ...options, dateOrder: 'MDY' })).toBe('2024-03-04');
    expect(cell('31/04/2024', 'eventDate', { ...options, dateOrder: 'DMY' })).toBe('31/04/2024');
  });
  it('preserva precisión decimal, signo y ceros; coma solo explícita; enteros no fracciones', () => {
    const options: Normalization = { ...off, numbers: true, coordinates: true, decimalMode: 'comma' };
    expect(cell('+00012,340000000000000000001', 'sampleSizeValue', options)).toBe('+00012.340000000000000000001');
    expect(cell('1,234', 'sampleSizeValue', { ...off, numbers: true })).toBe('1,234');
    for (const field of ['individualCount', 'year', 'month', 'day', 'startDayOfYear', 'endDayOfYear']) {
      expect(cell('1,5', field, options)).toBe('1,5');
      expect(cell('0001', field, options)).toBe('0001');
    }
    for (const value of ['NaN', 'Infinity', '1e3', '1,2,3', '-1,2']) expect(cell(value, 'individualCount', options)).toBe(value);
    expect(cell('12,3', 'occurrenceID', options)).toBe('12,3');
    expect(cell('12,3', 'measurementValue', options)).toBe('12,3');
  });
  it('no redondea límites inclusivos de coordenadas ni convierte DMS', () => {
    const options: Normalization = { ...off, coordinates: true, decimalMode: 'comma' };
    expect(cell('-090,000000', 'decimalLatitude', options)).toBe('-090.000000');
    expect(cell('+180,000', 'decimalLongitude', options)).toBe('+180.000');
    for (const value of ['90,000000000000000001', 'Infinity', 'NaN', '90°0′', '1e2']) expect(cell(value, 'decimalLatitude', options)).toBe(value);
  });
  it('resuelve propios incluso nombres prototipo y comparte proyección de requeridos', () => {
    const original = data(['toString', '__proto__', 'Fecha'], [[' NULL ', '2024/02/29', ' N/A ']]);
    const mapping = JSON.parse('{"__proto__":"eventDate","Fecha":"eventDate"}') as Record<string, string>;
    const options = { trim: true, emptyMarkers: true, dates: true };
    const snapshot = buildNormalizationPreview(original, mapping, options);
    expect(snapshot.metadata.columns.map(c => c.effectiveField)).toEqual(['toString', 'eventDate', 'eventDate']);
    expect(readPreviewPage(snapshot, { ...page, columnIndices: [1] }).rows[0].cells[0].after).toBe('2024-02-29');
    expect(missingCells(data(['Fecha'], [[' N/A ']]), { Fecha: 'eventDate' }, 'eventDate', options)).toEqual([{ header: 'Fecha', column: 1, field: 'eventDate', row: 2, before: ' N/A ', after: '' }]);
  });
});

describe('preview completa, compacta y duplicados independientes', () => {
  it('alcanza más de 20, última página, columnas ocultas/no contiguas y reversión', () => {
    const original = data(['empty', 'value', 'marker'], Array.from({ length: 36 }, (_, i) => ['  ', ` ${i} `, 'NULL']));
    const snapshot = buildNormalizationPreview(original, {}, { trim: true, emptyMarkers: true });
    expect(snapshot.metadata).toMatchObject({ totalRows: 36, totalColumns: 3, changedCells: 108, changedRows: 36, emptyColumnIndices: [0, 2] });
    const last = readPreviewPage(snapshot, { ...page, offset: 25, columnIndices: [2, 1] });
    expect(last.rows).toHaveLength(11);
    expect(last.rows.at(-1)).toMatchObject({ sourceRow: 107, cells: [{ columnIndex: 2, before: 'NULL', after: '', kinds: ['empty-marker'] }, { columnIndex: 1, before: ' 35 ', after: '35', kinds: ['trim'] }] });
    expect(readPreviewPage(snapshot, { ...page, columnIndices: [] }).rows[0].cells).toEqual([]);
    expect(readPreviewPage(snapshot, { ...page, offset: 36 }).rows).toEqual([]);
    const reverted = buildNormalizationPreview(original, {}, off);
    expect(reverted.metadata.emptyColumnIndices).toEqual([0]);
    expect(readPreviewPage(reverted, { ...page, columnIndices: [1] }).rows[0].cells[0].after).toBe(' 0 ');
    for (const window of [{ ...page, offset: -1 }, { ...page, columnIndices: [1, 1] }, { ...page, columnIndices: [3] }]) expect(() => readPreviewPage(snapshot, window)).toThrow();
  });
  it('filtra metadatos completos más allá de 50 columnas y no recorre otras filas al paginar', () => {
    const original = data(Array.from({ length: 60 }, (_, i) => `c${i}`), Array.from({ length: 26 }, () => Array.from({ length: 60 }, (_, i) => i === 59 ? 'dato' : ' \t ')));
    const snapshot = buildNormalizationPreview(original, {}, off);
    expect(snapshot.metadata.emptyColumnIndices).toEqual(Array.from({ length: 59 }, (_, i) => i));
    Object.defineProperty(original.rows[0], 'values', { get: () => { throw new Error('No reescanear filas fuera de página'); } });
    const result = readPreviewPage(snapshot, { offset: 25, limit: 100, columnIndices: [59] });
    expect(result.rows).toEqual([{ sourceRow: 77, cells: [{ columnIndex: 59, before: 'dato', after: 'dato', kinds: [] }] }]);
    const empty = buildNormalizationPreview(data(['blank'], [[' '], ['\t']]), {}, off);
    expect(empty.metadata.emptyColumnIndices).toEqual([0]);
    expect(readPreviewPage(empty, { ...page, columnIndices: [] }).rows).toHaveLength(2);
  });
  it('separa grupos completos e IDs exactos superpuestos con todas las filas físicas', () => {
    const original = data(['id', 'hidden'], [['001', 'x'], ['001', 'x'], ['001', 'y'], ['1', 'x'], ['A', 'x'], ['a', 'x'], ['', 'z'], ['', 'z'], [' ', 'z']]);
    const snapshot = buildNormalizationPreview(original, { id: 'occurrenceID' }, { ...off, duplicates: true });
    const d = snapshot.metadata.duplicates;
    expect(d.equalRows.groups.map(g => g.sourceRows)).toEqual([[2, 5], [20, 23]]);
    expect(d.occurrenceIds.groups.map(g => g.sourceRows)).toEqual([[2, 5, 8]]);
    expect(d.equalRows.affectedRows).toBe(4);
    expect(d.occurrenceIds.affectedRows).toBe(3);
    const row = readPreviewPage(snapshot, page).rows[0];
    expect(row.equalRowGroup).toBe(d.equalRows.groups[0].groupId);
    expect(row.occurrenceIdGroup).toBe(d.occurrenceIds.groups[0].groupId);
    expect(row.equalRowGroup).not.toBe(row.occurrenceIdGroup);
    expect(snapshot.metadata.changedCells).toBe(0);
    const noId = buildNormalizationPreview(original, {}, { ...off, duplicates: true });
    expect(noId.metadata.duplicates.occurrenceIdColumnIndex).toBeNull();
    expect(noId.metadata.duplicates.equalRows.affectedRows).toBe(4);
    expect(buildNormalizationPreview(original, {}, off).metadata.duplicates.enabled).toBe(false);
  });
  it('no colisiona por delimitadores, y detecta sobre copia normalizada', () => {
    const original = data(['a', 'b'], [['a|b', 'c'], ['a', 'b|c'], [' a|b ', 'c']]);
    const snapshot = buildNormalizationPreview(original, {}, { trim: true, emptyMarkers: false, duplicates: true });
    expect(snapshot.metadata.duplicates.equalRows.groups.map(g => g.sourceRows)).toEqual([[2, 8]]);
  });
  it('valida guard unknown sin admitir metadata, ventanas o tokens malformados', () => {
    const snapshot = buildNormalizationPreview(data(['x'], [['a']]), {}, off);
    const reply = { id: 1, session: 1, generation: 1, kind: 'preview-ready', metadata: snapshot.metadata, ...readPreviewPage(snapshot, page) };
    expect(isPreviewResponse(reply)).toBe(true);
    for (const value of [null, {}, { ...reply, id: -1 }, { ...reply, rows: [{}] }, { ...reply, metadata: {} }, { ...reply, window: { ...page, limit: 101 } }]) expect(isPreviewResponse(value)).toBe(false);
  });
});

describe('eventDate ISO común y coherencia solo inequívoca', () => {
  const run = (value: string, components: string[] = []) => {
    const headers = ['eventDate', ...['year', 'month', 'day'].slice(0, components.length)];
    const terms = headers.map(name => ({ name, uri: name, definition: name, category: 'Record', status: 'recommended' as const }));
    return validate(data(headers, [[value, ...components]]), {}, configurationFixture([]), terms, 'other');
  };
  it.each(['0001', '2024-02', '2024-02-29T12:30', '2024-02-29T12:30:59.123+05:30', '2024-01/2024-02', '2024-01-01/2024-02-01'])('acepta %s', value => expect(run(value)).toEqual([]));
  it.each(['0000', '2023-02-29T12:30', '2024-13', '2024-01-01T25:00', '2024-01-01T12:60', '2024-01/garbage'])('rechaza %s', value => expect(run(value)).toHaveLength(1));
  it('no inventa componentes para parciales ni intervalos', () => {
    expect(run('2024', ['2024', '2', '29'])).toEqual([]);
    expect(run('2024-02', ['2024', '3'])).toHaveLength(1);
    expect(run('2024-01/2025-12', ['2000'])).toEqual([]);
  });
});
