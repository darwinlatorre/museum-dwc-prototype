import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PreviewResponse } from '../models/normalization-preview';

const options = { trim: true, emptyMarkers: true, dates: true, coordinates: true, numbers: true, duplicates: true };
const window = { offset: 0, limit: 10, columnIndices: [0], rowFilter: 'all' };
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
async function worker() {
  let listener!: (event: MessageEvent) => Promise<void>;
  const replies: PreviewResponse[] = [];
  vi.stubGlobal('addEventListener', (_: string, callback: typeof listener) => { listener = callback; });
  vi.stubGlobal('postMessage', (reply: PreviewResponse) => replies.push(structuredClone(reply)));
  await import('./normalization-preview.worker');
  let id = 0;
  const send = async (payload: object, generation = 1) => {
    await listener({ data: { id: ++id, session: 1, generation, ...payload } } as MessageEvent);
    return replies.at(-1)!;
  };
  return { send, replies };
}
function rows(reply: PreviewResponse) {
  if (reply.kind !== 'preview-ready' && reply.kind !== 'preview-page') throw new Error(JSON.stringify(reply));
  return reply.rows;
}
describe('orden global de preview por protocolo público', () => {
  it('ordena Fila numéricamente antes de paginar, incluso sin sort explícito', async () => {
    const p = await worker();
    const original = { headers: ['id'], rows: [10, 2, 12, 3, 11, 4, 9, 5, 8, 6, 7, 1].map(row => ({ row, values: [`${row}`] })) };
    const before = structuredClone(original);
    expect(rows(await p.send({ kind: 'preview-init', original, mapping: {}, options, window })).map(r => r.sourceRow)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(rows(await p.send({ kind: 'preview-page', window: { ...window, offset: 10 } })).map(r => r.sourceRow)).toEqual([11, 12]);
    expect(rows(await p.send({ kind: 'preview-page', window: { ...window, sort: { columnIndex: null, direction: 'desc' } } })).map(r => r.sourceRow)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
    expect(original).toEqual(before);
    expect(p.replies.filter(r => r.kind === 'preview-ready')).toHaveLength(1);
  });
  it('usa valores efectivos literales, blancos al final en ambas direcciones y desempate fuente', async () => {
    const p = await worker();
    const values = ['z', '10', '2', '001', '0', 'A', 'a', 'é', '\uE000', '😀', '', 'NULL', 'A'];
    const original = { headers: ['same', 'same'], rows: values.map((v, i) => ({ row: i + 2, values: ['constant', ` ${v} `] })) };
    await p.send({ kind: 'preview-init', original, mapping: {}, options, window });
    const asc = [6, 5, 3, 4, 7, 14, 8, 2, 9, 10, 11, 12, 13];
    const desc = [11, 10, 9, 2, 8, 7, 14, 4, 3, 5, 6, 12, 13];
    for (const [direction, expected] of [['asc', asc], ['desc', desc]] as const) {
      const view = { ...window, columnIndices: [1], sort: { columnIndex: 1, direction } };
      const first = rows(await p.send({ kind: 'preview-page', window: view }));
      const second = rows(await p.send({ kind: 'preview-page', window: { ...view, offset: 10 } }));
      expect([...first, ...second].map(r => r.sourceRow)).toEqual(expected);
      for (const row of [...first, ...second]) {
        expect(row.cells[0].before).toBe(original.rows[row.sourceRow - 2].values[1]);
        expect(row.cells[0].after).toBe(values[row.sourceRow - 2] === 'NULL' ? '' : values[row.sourceRow - 2]);
      }
      expect(first.find(r => r.sourceRow === 7)).toMatchObject({ equalRowGroup: expect.any(String), cells: [{ columnIndex: 1, before: ' A ', after: 'A', kinds: ['trim'] }] });
    }
  });
  it('preserva espacios sin trim, ceros, case y orden de texto sin coerción', async () => {
    const p = await worker();
    const values = ['2', '10', ' ', ' A', 'A', 'a', '00', '', '😀', '\uE000'];
    await p.send({ kind: 'preview-init', original: { headers: ['id'], rows: values.map((v, i) => ({ row: i + 1, values: [v] })) }, mapping: {}, options: { trim: false, emptyMarkers: false }, window });
    for (const [direction, expected] of [['asc', [3, 4, 7, 2, 1, 5, 6, 10, 9, 8]], ['desc', [9, 10, 6, 5, 1, 2, 7, 4, 3, 8]]] as const) {
      expect(rows(await p.send({ kind: 'preview-page', window: { ...window, sort: { columnIndex: 0, direction } } })).map(r => r.sourceRow)).toEqual(expected);
    }
  });
  it('filtra cambios en todas las columnas antes de paginar, mantiene identidad y no renormaliza', async () => {
    const p = await worker();
    const original = { headers: Array.from({ length: 52 }, (_, i) => `c${i}`), rows: Array.from({ length: 24 }, (_, i) => ({ row: i + 2, values: Array.from({ length: 52 }, (_, c) => c === 0 ? `${99 - i}` : c === 51 && i % 2 === 0 ? ' x ' : 'x') })) };
    const ready = await p.send({ kind: 'preview-init', original, mapping: {}, options, window });
    expect(ready).toMatchObject({ metadata: { changedRows: 12, changedCells: 12 } });
    const view = { ...window, rowFilter: 'changed', sort: { columnIndex: 0, direction: 'asc' } };
    expect(rows(await p.send({ kind: 'preview-page', window: view })).map(r => r.sourceRow)).toEqual([24, 22, 20, 18, 16, 14, 12, 10, 8, 6]);
    expect(rows(await p.send({ kind: 'preview-page', window: { ...view, offset: 10, columnIndices: [51] } }))).toMatchObject([{ sourceRow: 4, cells: [{ columnIndex: 51, before: ' x ', after: 'x' }] }, { sourceRow: 2 }]);
    // A new direction/page must use cached keys, not scan source cells or rerun rules.
    for (const row of original.rows) Object.defineProperty(row, 'values', { get: () => { throw new Error('No relectura de originales'); } });
    expect(rows(await p.send({ kind: 'preview-page', window: { ...view, columnIndices: [], sort: { columnIndex: 0, direction: 'desc' } } })).map(r => r.sourceRow)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    expect(p.replies.filter(r => r.kind === 'preview-ready')).toHaveLength(1);
    expect(p.replies.every(r => !('original' in r) && !('current' in r) && !(r.kind === 'preview-page' && 'metadata' in r))).toBe(true);
  });
  it('rechaza sort malformado o fuera de rango sin perder snapshot ni consumir generación', async () => {
    const p = await worker();
    const original = { headers: ['id'], rows: [{ row: 2, values: [' x '] }] };
    await p.send({ kind: 'preview-init', original, mapping: {}, options, window });
    for (const sort of [null, {}, { columnIndex: -1, direction: 'asc' }, { columnIndex: 0, direction: 'ASC' }, { columnIndex: 'id', direction: 'asc' }, { columnIndex: 1, direction: 'asc' }]) {
      expect(await p.send({ kind: 'preview-page', window: { ...window, sort } })).toMatchObject({ kind: 'preview-error', message: 'Ventana de vista previa inválida.' });
    }
    expect(await p.send({ kind: 'preview-update', options, window: { ...window, sort: { columnIndex: 0, direction: 'bad' } } }, 2)).toMatchObject({ kind: 'preview-error' });
    expect(rows(await p.send({ kind: 'preview-page', window }))).toMatchObject([{ sourceRow: 2, cells: [{ before: ' x ', after: 'x' }] }]);
    expect(await p.send({ kind: 'preview-update', options: { trim: false, emptyMarkers: false }, window }, 2)).toMatchObject({ kind: 'preview-ready', generation: 2, metadata: { changedCells: 0 }, rows: [{ cells: [{ after: ' x ' }] }] });
  });
});
