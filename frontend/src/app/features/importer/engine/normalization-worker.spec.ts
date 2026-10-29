import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PreviewResponse } from '../models/normalization-preview';
import { LIMITS } from '../models/dataset';
import { configurationFixture } from '../../../testing/validation-fixture';
const options = { trim: false, emptyMarkers: false };
const window = { offset: 0, limit: 10 as const, columnIndices: [0] };
const original = { headers: ['alias', 'hidden'], rows: [{ row: 4, values: [' A ', 'x'] }, { row: 9, values: ['A', 'x'] }, { row: 20, values: ['A', 'y'] }] };
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
async function preview() {
  let listener: (event: MessageEvent) => Promise<void>;
  const replies: PreviewResponse[] = [];
  vi.stubGlobal('addEventListener', (_: string, callback: typeof listener) => { listener = callback; });
  vi.stubGlobal('postMessage', (reply: PreviewResponse) => replies.push(structuredClone(reply)));
  await import('./normalization-preview.worker');
  let id = 0;
  const send = (payload: object, session = 1, generation = 1) => listener({ data: { id: ++id, session, generation, ...payload } } as MessageEvent);
  const init = (extra = {}) => ({ kind: 'preview-init', original, mapping: { alias: 'occurrenceID' }, options, window, ...extra });
  return { send, init, replies };
}
describe('worker persistente por frontera postMessage', () => {
  it('cachea original, devuelve páginas pequeñas y revierte opciones desde original', async () => {
    const p = await preview();
    await p.send(p.init());
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-ready', id: 1, session: 1, generation: 1, metadata: { changedCells: 0 } });
    await p.send({ kind: 'preview-update', options: { ...options, trim: true, duplicates: true }, window }, 1, 2);
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-ready', metadata: { changedCells: 1, duplicates: { equalRows: { affectedRows: 2 }, occurrenceIds: { affectedRows: 3 } } } });
    await p.send({ kind: 'preview-page', window: { ...window, columnIndices: [] } }, 1, 2);
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-page', rows: [{ sourceRow: 4, cells: [] }, { sourceRow: 9, cells: [] }, { sourceRow: 20, cells: [] }] });
    await p.send({ kind: 'preview-update', options, window }, 1, 3);
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-ready', rows: [{ sourceRow: 4, cells: [{ after: ' A ' }] }, { sourceRow: 9 }, { sourceRow: 20 }] });
    expect(p.replies.every(reply => !('data' in reply) && !('original' in reply))).toBe(true);
  });
  it('rechaza ventanas/opciones/sesiones malformadas sin corromper snapshot', async () => {
    const p = await preview();
    await p.send(p.init());
    for (const payload of [{ kind: 'preview-page', window: { ...window, columnIndices: [2] } }, { kind: 'preview-update', options: { trim: 'yes' }, window }, { kind: 'unknown' }]) {
      await p.send(payload);
      expect(p.replies.at(-1)?.kind).toBe('preview-error');
    }
    await p.send({ kind: 'preview-page', window }, 2);
    expect(p.replies.at(-1)?.kind).toBe('preview-error');
    await p.send({ kind: 'preview-page', window });
    expect(p.replies.at(-1)?.kind).toBe('preview-page');
    await p.send({ kind: 'preview-update', options, window }, 1, 0);
    expect(p.replies.at(-1)?.kind).toBe('preview-error');
    await p.send(p.init({ original: { headers: ['new'], rows: [{ row: 80, values: ['new'] }] }, mapping: {} }), 2, 1);
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-ready', session: 2, rows: [{ sourceRow: 80, cells: [{ before: 'new' }] }] });
  });
  it('rechaza datos y tokens inválidos, conserva el snapshot y descarta otra sesión pendiente', async () => {
    const p = await preview();
    await p.send(p.init());
    await p.send(p.init({ original: { headers: ['bad'], rows: [{ row: 2, values: [null] }] } }), 2, 1);
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-error', session: 2, message: 'Datos de vista previa inválidos.' });
    await p.send({ kind: 'preview-page', window });
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-page', session: 1 });
    await p.send({ kind: 'preview-page', window, id: 'bad' });
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-error', id: 0, session: 0, generation: 0 });
    const large = { headers: ['alias'], rows: Array.from({ length: 12000 }, (_, i) => ({ row: i + 2, values: ['old'] })) };
    const pending = p.send(p.init({ original: large }), 3, 1);
    await p.send(p.init({ original: { headers: ['new'], rows: [{ row: 8, values: ['new'] }] } }), 4, 1);
    await pending;
    expect(p.replies.filter(r => r.kind === 'preview-ready').map(r => r.session)).toEqual([1, 4]);
    await p.send({ kind: 'preview-page', window }, 3, 1);
    expect(p.replies.at(-1)?.kind).toBe('preview-error');
  });
  it('cede tareas reales, update/cancel impiden publicar generaciones viejas', async () => {
    const p = await preview();
    const large = { headers: ['alias'], rows: Array.from({ length: 12000 }, (_, i) => ({ row: i + 2, values: [' A '] })) };
    let tick = false;
    const pending = p.send(p.init({ original: large, options: { ...options, trim: true } }));
    const newer = new Promise<void>(resolve => setTimeout(() => {
      tick = true;
      void p.send({ kind: 'preview-update', options, window }, 1, 2).then(resolve);
    }, 0));
    await Promise.all([pending, newer]);
    expect(tick).toBe(true);
    expect(p.replies.filter(r => r.kind === 'preview-ready').map(r => r.generation)).toEqual([2]);
    const next = p.send({ kind: 'preview-update', options: { ...options, trim: true }, window }, 1, 3);
    await new Promise<void>(resolve => setTimeout(() => { void p.send({ kind: 'preview-cancel' }, 1, 3).then(resolve); }, 0));
    await next;
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-cancelled', generation: 3 });
    expect(p.replies.some(r => r.kind === 'preview-ready' && r.generation === 3)).toBe(false);
    await p.send({ kind: 'preview-page', window }, 1, 2);
    expect(p.replies.at(-1)).toMatchObject({ kind: 'preview-page', generation: 2 });
  });
});

describe('analysis worker conserva protocolo y añade avisos al aplicar', () => {
  async function analyze(duplicates: boolean, count = 3) {
    let listener: (event: MessageEvent) => Promise<void>;
    const replies: unknown[] = [];
    vi.stubGlobal('addEventListener', (_: string, callback: typeof listener) => { listener = callback; });
    vi.stubGlobal('postMessage', (reply: unknown) => replies.push(reply));
    await import('./analysis.worker');
    await listener!({ data: { id: 42, kind: 'validate', data: count === 3 ? original : { headers: ['alias', 'hidden'], rows: Array.from({ length: count }, (_, i) => ({ row: i + 2, values: ['A', 'x'] })) }, mapping: { alias: 'occurrenceID' }, options: { ...options, trim: true, duplicates }, terms: ['occurrenceID', 'hidden'].map(name => ({ name, uri: name, category: 'Record', definition: name, status: 'recommended' })), configuration: configurationFixture([]), context: 'other' } } as MessageEvent);
    return replies[0] as { kind: string; id: number; issues: { row: number; description: string; severity: string }[]; changes: unknown[]; message?: string };
  }
  it('distingue ambos criterios físicos, exporta claves vigentes sin Changes asesoras', async () => {
    const reply = await analyze(true);
    expect(reply.kind).toBe('result');
    expect(reply.id).toBe(42);
    expect(reply.changes).toEqual([{ row: 4, field: 'alias', before: ' A ', after: 'A' }]);
    expect(reply.issues.map(i => i.row)).toEqual([4, 9, 4, 9, 20]);
    expect(reply.issues.every(i => i.severity === 'WARNING' && i.description.length < 200)).toBe(true);
    expect(reply.issues[0].description).toContain('Filas completas iguales');
    expect(reply.issues[2].description).toContain('occurrenceID repetido');
    expect(Object.keys(reply.issues[0]).sort()).toEqual(['configurationRevision', 'context', 'description', 'field', 'row', 'severity']);
  });
  it('preserva aplicación legada sin duplicados', async () => {
    const reply = await analyze(false);
    expect(reply.issues).toEqual([]);
    expect(reply.changes).toHaveLength(1);
  });
  it('respeta LIMITS.issues y el error existente sin respuesta parcial', async () => {
    const reply = await analyze(true, LIMITS.rows + 1);
    expect(reply.kind).toBe('error');
    expect(reply.message).toBe('Se superó el límite de incidencias (100.000). Seleccione un archivo más pequeño.');
  });
});
