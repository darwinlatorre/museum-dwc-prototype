import { afterEach, describe, expect, it, vi } from 'vitest';
import { configurationFixture } from '../../../testing/validation-fixture';

async function worker() {
  let listener!: (event: MessageEvent) => Promise<void>;
  const replies: Record<string, unknown>[] = [];
  vi.stubGlobal('addEventListener', (_: string, callback: typeof listener) => { listener = callback; });
  vi.stubGlobal('postMessage', (reply: Record<string, unknown>) => replies.push(structuredClone(reply)));
  await import('./analysis.worker');
  let id = 0;
  const send = (request: object) => listener({ data: { id: ++id, session: 1, generation: 1, ...request } } as MessageEvent);
  const original = { headers: ['ID', 'scientificName'], rows: [{ row: 19, values: ['0001', ' Aus bus '] }] };
  const validate = (extra = {}) => send({ kind: 'validate', data: original, mapping: { ID: 'occurrenceID' }, configuration: configurationFixture([]), terms: [], context: 'collection', options: { trim: false, emptyMarkers: false }, ...extra });
  return { send, replies, original, validate };
}
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
describe('preparación local desde el análisis vigente', () => {
  it('conserva originales y exporta crudo; solo Apply cambia valores; revalida sin reenviar originales', async () => {
    const w = await worker();
    await w.validate();
    await w.send({ kind: 'prepare', offset: 0 });
    expect(w.replies.at(-1)).toMatchObject({ kind: 'prepared', offset: 0, done: true, rows: [{ sourceRow: 19, originalValues: ['0001', ' Aus bus '], values: ['0001', ' Aus bus '] }] });
    await w.validate({ data: undefined, generation: 2, options: { trim: true, emptyMarkers: true } });
    await w.send({ kind: 'prepare', offset: 0, generation: 2 });
    expect(w.replies.at(-1)).toMatchObject({ kind: 'prepared', rows: [{ sourceRow: 19, originalValues: ['0001', ' Aus bus '], values: ['0001', 'Aus bus'] }] });
    expect(w.original.rows[0].values).toEqual(['0001', ' Aus bus ']);
  });
  it('rechaza sesiones/generaciones obsoletas y offsets inválidos sin perder el análisis', async () => {
    const w = await worker(); await w.validate();
    for (const request of [{ session: 2 }, { generation: 0 }, { offset: -1 }, { offset: 2 }]) {
      await w.send({ kind: 'prepare', offset: 0, ...request });
      expect(w.replies.at(-1)?.['kind']).toBe('error');
    }
    await w.send({ kind: 'prepare', offset: 0 });
    expect(w.replies.at(-1)?.['kind']).toBe('prepared');
    await w.send({ kind: 'dispose' });
    await w.send({ kind: 'prepare', offset: 0 });
    expect(w.replies.at(-1)?.['kind']).toBe('error');
  });
  it('acota preparación por mensaje y comunica duplicados también en diagnóstico crudo', async () => {
    const w = await worker();
    await w.validate({ data: { headers: ['occurrenceID'], rows: Array.from({ length: 600 }, (_, i) => ({ row: i + 2, values: ['0001'] })) } });
    expect(w.replies.at(-1)).toMatchObject({ kind: 'result', duplicates: { equalRows: { groups: 1, affectedRows: 600 }, occurrenceIds: { groups: 1, affectedRows: 600 } } });
    await w.send({ kind: 'prepare', offset: 0 });
    expect((w.replies.at(-1)?.['rows'] as unknown[]).length).toBeLessThanOrEqual(256);
    expect(w.replies.at(-1)?.['done']).toBe(false);
  });
});
