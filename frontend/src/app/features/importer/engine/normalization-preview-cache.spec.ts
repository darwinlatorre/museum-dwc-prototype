import { expect, it } from 'vitest';
import { buildNormalizationPreview, readPreviewPage, type PreviewSnapshot } from './normalization-preview';
import type { Dataset } from '../models/dataset';
import type { PreviewWindow } from '../models/normalization-preview';

it('reutiliza claves de una columna al ordenar/paginar/filtrar y aísla snapshots', () => {
  const numbers = [20, 3, 17, 2, 11, 5, 19, 7, 13, 23, 29, 31];
  const keys = ['b', 'a', 'b', 'd', 'c', 'a', 'e', 'f', 'g', 'h', 'i', 'j'];
  const original: Dataset = {
    headers: ['key', 'other', 'change'],
    rows: numbers.map((row, i) => ({ row, values: [keys[i], String.fromCharCode(108 - i), i % 2 === 0 ? ' x ' : 'x'] })),
  };
  const originalBefore = JSON.stringify(original);
  for (const row of original.rows) { Object.freeze(row.values); Object.freeze(row); }
  Object.freeze(original.headers); Object.freeze(original.rows); Object.freeze(original);
  const built = buildNormalizationPreview(original, {}, { trim: true, emptyMarkers: true, duplicates: true });
  const snapshotBefore = JSON.stringify(built);
  expect(built.metadata).toMatchObject({ changedRows: 6, changedCells: 6, totalRows: 12 });
  const reads = [0, 0];
  const snapshot: PreviewSnapshot = {
    ...built,
    current: {
      ...built.current,
      rows: built.current.rows.map(row => ({
        ...row,
        values: new Proxy([...row.values], {
          get(target, property, receiver) {
            if (property === '0' || property === '1') reads[Number(property)]++;
            return Reflect.get(target, property, receiver);
          },
        }),
      })),
    },
  };
  const window: PreviewWindow = { offset: 0, limit: 10, columnIndices: [] };
  const rows = (input: PreviewSnapshot, change: Partial<PreviewWindow>) => {
    const result = readPreviewPage(input, { ...window, ...change });
    expect(result.rows.every(row => row.cells.length === 0)).toBe(true);
    return result.rows.map(row => row.sourceRow);
  };
  expect(rows(snapshot, {})).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 20, 23]);
  expect(reads).toEqual([0, 0]);
  const asc = { columnIndex: 0, direction: 'asc' } as const;
  const desc = { columnIndex: 0, direction: 'desc' } as const;
  expect(rows(snapshot, { sort: asc })).toEqual([3, 5, 20, 17, 11, 2, 19, 7, 13, 23]);
  expect(reads).toEqual([12, 0]);
  expect(rows(snapshot, { sort: asc, offset: 10 })).toEqual([29, 31]);
  expect(rows(snapshot, { sort: desc })).toEqual([31, 29, 23, 13, 7, 19, 2, 11, 20, 17]);
  expect(rows(snapshot, { sort: desc, rowFilter: 'changed' })).toEqual([29, 13, 19, 11, 20, 17]);
  expect(rows(snapshot, { sort: asc, rowFilter: 'changed' })).toEqual([20, 17, 11, 19, 13, 29]);
  expect(rows(snapshot, { sort: asc, rowFilter: 'all', offset: 10 })).toEqual([29, 31]);
  expect(rows(snapshot, { sort: desc, rowFilter: 'all', offset: 10 })).toEqual([3, 5]);
  expect(rows(snapshot, { sort: asc })).toEqual([3, 5, 20, 17, 11, 2, 19, 7, 13, 23]);
  expect(reads).toEqual([12, 0]);
  expect(rows(snapshot, { sort: { columnIndex: 1, direction: 'asc' } })).toEqual([31, 29, 23, 13, 7, 19, 5, 11, 2, 17]);
  expect(reads).toEqual([12, 12]);
  expect(rows(snapshot, { sort: asc })).toEqual([3, 5, 20, 17, 11, 2, 19, 7, 13, 23]);
  expect(reads).toEqual([24, 12]);
  const nextSnapshot: PreviewSnapshot = { ...snapshot };
  expect(rows(nextSnapshot, { sort: asc })).toEqual([3, 5, 20, 17, 11, 2, 19, 7, 13, 23]);
  expect(reads).toEqual([36, 12]);
  expect(rows(snapshot, { sort: desc, rowFilter: 'changed' })).toEqual([29, 13, 19, 11, 20, 17]);
  expect(reads).toEqual([36, 12]);
  expect(snapshot.metadata).toBe(built.metadata);
  expect(snapshot.duplicates).toBe(built.duplicates);
  expect(snapshot.original).toBe(original);
  expect(JSON.stringify(original)).toBe(originalBefore);
  expect(JSON.stringify(built)).toBe(snapshotBefore);
  expect(JSON.stringify(snapshot)).toBe(snapshotBefore);
  expect(JSON.stringify(nextSnapshot)).toBe(snapshotBefore);
});
