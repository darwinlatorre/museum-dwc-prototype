import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { App } from '../../../app';
import { Api } from '../../../core/api/api';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { ImportWorkbench } from './import-workbench';
import { configurationFixture } from '../../../testing/validation-fixture';
import type { Dataset } from '../models/dataset';
import type { WorkerRequest, WorkerResponse } from '../models/worker-protocol';
import type { PreviewRequest, PreviewResponse } from '../models/normalization-preview';
import { buildNormalizationPreview, readPreviewPage, type PreviewSnapshot } from '../engine/normalization-preview';

type ResponseBody<T = WorkerResponse> = T extends WorkerResponse ? Omit<T, 'id'> : never;
class DelayedWorker {
  static all: DelayedWorker[] = [];
  static previewAutomatic = true;
  onmessage?: (event: MessageEvent<WorkerResponse | PreviewResponse>) => void;
  onerror?: () => void;
  request!: WorkerRequest | PreviewRequest;
  requests: (WorkerRequest | PreviewRequest)[] = [];
  terminated = false;
  previewRole = false;
  private original?: Dataset;
  private mapping: Record<string, string> = {};
  private snapshot?: PreviewSnapshot;
  constructor(_url: URL) { DelayedWorker.all.push(this); }
  postMessage(request: WorkerRequest | PreviewRequest) {
    this.previewRole = request.kind.startsWith('preview-');
    this.request = request;
    this.requests.push(request);
    if (this.previewRole && DelayedWorker.previewAutomatic) queueMicrotask(() => this.answerPreview(request as PreviewRequest));
  }
  answerPreview(request = this.request as PreviewRequest) {
    if (request.kind === 'preview-cancel') return;
    if (request.kind === 'preview-init') {
      this.original = structuredClone(request.original);
      this.mapping = request.mapping;
    }
    if (request.kind !== 'preview-page') this.snapshot = buildNormalizationPreview(this.original!, this.mapping, request.options);
    this.emitPreview({ ...request, kind: request.kind === 'preview-page' ? 'preview-page' : 'preview-ready',
      ...readPreviewPage(this.snapshot!, request.window), metadata: this.snapshot!.metadata } as PreviewResponse);
  }
  emitPreview(response: unknown) { this.onmessage?.({ data: response } as MessageEvent<PreviewResponse>); }
  terminate() { this.terminated = true; }
  respond(response: ResponseBody) {
    this.onmessage?.({ data: { ...response, id: this.request.id } } as MessageEvent<WorkerResponse>);
  }
}
async function setup(fields: string[] = [], data: Dataset = { headers: ['a', 'b'], rows: [{ row: 2, values: ['1', '2'] }] }) {
  const f = TestBed.createComponent(ImportWorkbench);
  f.componentRef.setInput('configuration', configurationFixture(fields));
  f.componentRef.setInput('terms', []);
  await f.whenStable();
  const root = f.nativeElement as HTMLElement;
  const button = (name: string) => {
    const found = [...root.querySelectorAll('button')].find(b =>
      (b.closest('.steps') ? b.textContent?.replace(/^\s*\d+\s*/, '').trim() : b.textContent?.trim()) === name || b.getAttribute('aria-label') === name);
    expect(found, name).toBeTruthy();
    return found!;
  };
  const click = async (name: string) => { button(name).click(); await f.whenStable(); };
  const input = root.querySelector('input[type=file]')!;
  Object.defineProperty(input, 'files', { value: [new File(['a,b\n1,2'], 'original.csv')] });
  input.dispatchEvent(new Event('change'));
  await f.whenStable();
  DelayedWorker.all.at(-1)!.respond({ kind: 'parsed', data });
  await f.whenStable();
  const chooseContext = async (context = 'collection') => {
    (root.querySelector(`.context-grid input[value=${context}]`) as HTMLInputElement).click();
    await f.whenStable();
  };
  const respond = async () => {
    DelayedWorker.all.at(-1)!.respond({ kind: 'result', issues: [], changes: [] });
    await f.whenStable();
  };
  return { f, root, button, click, chooseContext, respond };
}

async function normalization(data: Dataset) {
  const view = await setup([], data);
  await view.chooseContext(); await view.click('Mapear columnas'); await view.click('Validar localmente'); await view.respond(); await view.click('Normalizar');
  const preview = DelayedWorker.all.filter(worker => worker.previewRole).at(-1)!;
  const toggle = async (text: string) => {
    const label = [...view.root.querySelectorAll('label')].find(item => item.textContent?.trim() === text);
    expect(label, text).toBeTruthy();
    (label!.querySelector('input') as HTMLInputElement).click(); await view.f.whenStable();
  };
  return { ...view, preview, toggle };
}

describe('Preservación pública del análisis local', () => {
  beforeEach(() => {
    DelayedWorker.all = [];
    DelayedWorker.previewAutomatic = true;
    vi.stubGlobal('Worker', DelayedWorker);
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

  it('ordena seis pasos, exige un contexto único, valida antes de normalizar y deja Finalizar vacío', async () => {
    const { f, root, button, click, chooseContext, respond } = await setup();
    expect([...root.querySelectorAll('.steps button')].map(b => b.textContent?.replace(/^\s*\d+\s*/, '').trim())).toEqual([
      'Seleccionar archivo', 'Contexto', 'Mapear columnas', 'Diagnóstico', 'Normalizar', 'Finalizar',
    ]);
    expect(root.querySelector('h3')?.textContent).toContain('contexto');
    expect(button('Mapear columnas').disabled).toBe(true);
    expect([...root.querySelectorAll<HTMLInputElement>('.context-grid input')].every(input => !input.checked && input.type === 'radio')).toBe(true);
    await chooseContext();
    await chooseContext('permit');
    const radios = [...root.querySelectorAll<HTMLInputElement>('.context-grid input')];
    expect(radios.filter(input => input.checked).map(input => input.value)).toEqual(['permit']);
    await click('Mapear columnas');
    await click('Validar localmente');
    expect(DelayedWorker.all.at(-1)!.request).toMatchObject({ kind: 'validate', configuration: configurationFixture([]), context: 'permit', options: { trim: false, emptyMarkers: false } });
    expect(DelayedWorker.all.at(-1)!.request).not.toHaveProperty('profiles');
    await respond();
    expect(root.querySelector('h3')?.textContent).toBe('Diagnóstico');
    await click('Normalizar');
    (root.querySelector('.checks input') as HTMLInputElement).click();
    await f.whenStable();
    await click('Aplicar normalización y validar');
    expect(DelayedWorker.all.at(-1)!.request).toMatchObject({ kind: 'validate', options: { trim: true, emptyMarkers: false } });
    await respond();
    expect(root.querySelector('h3')?.textContent).toContain('Normalice');
    await click('Finalizar');
    expect(root.querySelector('.wizard-final')?.textContent?.trim()).toBe('');
    expect(root.textContent).toContain('original.csv');
  });

  it('ofrece seis reglas reversibles y ocultación visual con interruptores públicos', async () => {
    const { root, click, chooseContext, respond } = await setup();
    await chooseContext(); await click('Mapear columnas'); await click('Validar localmente'); await respond();
    await click('Normalizar');
    const switches = [...root.querySelectorAll<HTMLInputElement>('input[role=switch]')];
    expect(switches).toHaveLength(7);
    expect(switches.every(control => !control.checked)).toBe(true);
    expect(root.textContent).toContain('Todos los registros');
    expect(root.textContent).not.toContain('primeros 20');
  });

  it('solicita la hoja completa al worker persistente sin normalizar en la vista', async () => {
    const data = { headers: ['eventDate'], rows: Array.from({ length: 31 }, (_, i) => ({ row: i + 5, values: ['2024/02/29'] })) };
    const { root, click, chooseContext, respond } = await setup([], data);
    await chooseContext(); await click('Mapear columnas'); await click('Validar localmente'); await respond();
    await click('Normalizar');
    expect(DelayedWorker.all.map(worker => worker.request)).toContainEqual(expect.objectContaining({ kind: 'preview-init', original: data }));
    expect(root.querySelector('select[aria-label="Registros por página"]')).toBeTruthy();
  });

  it('permite mapear sin encabezados obligatorios y envía el snapshot real al worker', async () => {
    const { root, button, click, chooseContext } = await setup(['subfamily']);
    await chooseContext();
    expect(button('Mapear columnas').disabled).toBe(false);
    expect(DelayedWorker.all).toHaveLength(1);
    await click('Mapear columnas');
    await click('Validar localmente');
    expect(DelayedWorker.all.at(-1)!.request).toMatchObject({
      configuration: configurationFixture(['subfamily']), context: 'collection',
      data: { headers: ['a', 'b'], rows: [{ row: 2, values: ['1', '2'] }] },
    });
    expect(root.textContent).not.toContain('No puede continuar');
  });

  it('resume diez valores obligatorios ausentes una sola vez y distingue columna ausente', async () => {
    const data = { headers: ['subfamily'], rows: Array.from({ length: 12 }, (_, i) => ({ row: i + 2, values: [i < 10 ? '  ' : 'Formicinae'] })) };
    const { f, root, click, chooseContext } = await setup(['subfamily', 'absent'], data);
    await chooseContext();
    await click('Mapear columnas');
    await click('Validar localmente');
    DelayedWorker.all.at(-1)!.respond({ kind: 'result', issues: [
      { field: 'subfamily', row: 2, description: 'Falta subfamily', severity: 'ERROR', context: 'collection', configurationRevision: 7 },
    ], changes: [] });
    await f.whenStable();
    const rows = [...root.querySelectorAll('.missing-summary tbody tr')];
    expect(rows).toHaveLength(2);
    expect(rows.find(r => r.textContent?.includes('subfamily'))?.textContent).toContain('10 de 12');
    expect(rows.find(r => r.textContent?.includes('absent'))?.textContent).toContain('Columna ausente');
    expect(root.querySelector('tr.issue-error')).toBeNull();
    await click('Ver todas las incidencias');
    expect(root.querySelector('tr.issue-error')?.textContent).toContain('Falta subfamily');
    expect(root.querySelector('tr.issue-error')?.textContent).toContain('Colección biológica · 7');
    expect(data.rows[0].values[0]).toBe('  ');
  });

  it('abre faltantes con columna y filas originales en un detalle único y devuelve el foco al cerrar', async () => {
    const data = { headers: ['vacía original', 'subfamily', 'con datos'], rows: [
      { row: 4, values: ['  ', 'presente', 'x'] }, { row: 19, values: ['', 'presente', 'y'] },
    ] };
    const original = JSON.stringify(data);
    const { f, root, button, click, chooseContext, respond } = await setup(['subfamily', 'absent'], data);
    await chooseContext();
    await click('Mapear columnas');
    const edit = async (header: string, value: string) => {
      const input = root.querySelector<HTMLInputElement>(`input[aria-label="Mapear ${header}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
      await f.whenStable();
    };
    await edit('subfamily', 'otro');
    await edit('vacía original', 'subfamily');
    await click('Validar localmente');
    await respond();
    const trigger = button('Ver valores vacíos de subfamily');
    expect(trigger.type).toBe('button');
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('.missing-summary')?.textContent).toContain('Columna ausente');
    expect(root.querySelector('.missing-summary')?.textContent).toContain('2 de 2');
    expect(root.querySelector('[aria-label="Ver valores vacíos de absent"]')).toBeNull();
    trigger.focus();
    await click('Ver valores vacíos de subfamily');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#all-issues-detail')).toBeNull();
    const detail = root.querySelector<HTMLElement>('#missing-cell-detail')!;
    expect(detail.getAttribute('role')).toBe('region');
    expect(detail.getAttribute('aria-labelledby')).toBe('missing-cell-title');
    expect(detail.querySelector('h4')?.textContent).toContain('subfamily · 2 registros sin datos');
    expect(document.activeElement?.id).toBe('missing-cell-title');
    const rows = [...detail.querySelectorAll('tbody tr')].map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent));
    expect(detail.querySelector('.missing-source')?.textContent).toContain('vacía original');
    expect(detail.querySelector('.missing-source')?.textContent).toContain('Columna 1');
    expect(rows).toEqual([['4', '  '], ['19', '(vacío)']]);
    expect(getComputedStyle(detail.querySelector('.p-paginator')!).display).toBe('none');
    expect(getComputedStyle(root.querySelector('.missing-summary .p-paginator')!).display).toBe('none');
    button('Cerrar detalle de valores vacíos').focus();
    await click('Cerrar detalle de valores vacíos');
    expect(root.querySelector('#missing-cell-detail')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await click('Ver todas las incidencias');
    expect(document.activeElement?.id).toBe('all-issues-title');
    await click('Ver valores vacíos de subfamily');
    expect(root.querySelector('#all-issues-detail')).toBeNull();
    expect(root.querySelector('#missing-cell-detail')).toBeTruthy();
    await click('Ver todas las incidencias');
    expect(root.querySelector('#missing-cell-detail')).toBeNull();
    await click('Cerrar incidencias');
    expect(document.activeElement).toBe(button('Ver todas las incidencias'));
    expect(JSON.stringify(data)).toBe(original);
  });

  it('localiza NULL y N/A solo con aprobación y elimina el detalle al invalidar', async () => {
    const data = { headers: ['subfamily'], rows: ['', 'NULL', 'N/A', ' n/a '].map((value, i) => ({ row: i * 7 + 3, values: [value] })) };
    const original = JSON.stringify(data);
    const { f, root, click, chooseContext, respond } = await setup(['subfamily'], data);
    await chooseContext();
    await click('Mapear columnas');
    await click('Validar localmente');
    await respond();
    await click('Ver valores vacíos de subfamily');
    expect(root.querySelectorAll('#missing-cell-detail tbody tr')).toHaveLength(1);
    await click('Normalizar');
    (root.querySelectorAll('.checks input')[1] as HTMLInputElement).click();
    await f.whenStable();
    await click('Aplicar normalización y validar');
    await respond();
    await click('Ver diagnóstico');
    expect(root.querySelector('#missing-cell-detail')).toBeNull();
    await click('Ver valores vacíos de subfamily');
    expect([...root.querySelectorAll('#missing-cell-detail tbody tr')].map(row => row.textContent)).toEqual([
      expect.stringContaining('3'), expect.stringContaining('NULL'), expect.stringContaining('N/A'),
    ]);
    expect(root.querySelectorAll('#missing-cell-detail tbody tr')).toHaveLength(3);
    await click('Normalizar');
    (root.querySelectorAll('.checks input')[0] as HTMLInputElement).click();
    await f.whenStable();
    await click('Aplicar normalización y validar');
    await respond();
    await click('Ver diagnóstico');
    await click('Ver valores vacíos de subfamily');
    const rows = [...root.querySelectorAll('#missing-cell-detail tbody tr')];
    expect(rows).toHaveLength(4);
    expect(rows.map(row => row.querySelectorAll('td')[2].textContent)).toEqual(['—', '(vacío)', '(vacío)', '(vacío)']);
    expect(rows[3].querySelectorAll('td')[1].textContent).toBe(' n/a ');
    await click('Cambiar contexto');
    await chooseContext('other');
    expect(root.querySelector('#missing-cell-detail')).toBeNull();
    await click('Mapear columnas');
    await click('Validar localmente');
    await respond();
    await click('Ver valores vacíos de subfamily');
    expect(root.querySelectorAll('#missing-cell-detail tbody tr')).toHaveLength(1);
    expect(JSON.stringify(data)).toBe(original);
  });

  it('pliega ayudas sin perder las etiquetas ni las salvedades científicas', async () => {
    const { root } = await setup();
    const help = root.querySelector('details');
    expect(help?.open).toBe(false);
    expect(help?.textContent).toContain('no constituye una certificación del SiB');
    help!.open = true;
    expect(help?.querySelector('summary')?.textContent).toContain('contexto');
    expect(root.textContent).toContain('revisión 7');
    expect(root.textContent).toContain('Otros: observaciones en campo');
  });

  it('pide desplazamiento horizontal al cambiar de paso, no al cambiar solo el contexto', async () => {
    const scroll = vi.fn();
    const previous = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scroll });
    try {
      const { root, click, chooseContext } = await setup();
      await chooseContext();
      scroll.mockClear();
      await click('Mapear columnas');
      expect(scroll).toHaveBeenCalledTimes(1);
      expect(scroll.mock.instances[0]).toBe(root.querySelector('.steps'));
      expect(scroll.mock.calls[0][0]).toMatchObject({ behavior: 'instant' });
      await click('Contexto');
      scroll.mockClear();
      await chooseContext('other');
      expect(scroll).not.toHaveBeenCalled();
    } finally {
      if (previous) Object.defineProperty(HTMLElement.prototype, 'scrollTo', previous);
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
    }
  });

  it('mantiene visible el paso activo al redimensionar sin mover el documento y retira el listener al destruirse', async () => {
    const { f, root, click, chooseContext, respond } = await setup();
    await chooseContext();
    await click('Mapear columnas');
    await click('Validar localmente');
    await respond();
    const strip = root.querySelector<HTMLElement>('.steps')!;
    const active = strip.querySelector<HTMLElement>('.current')!;
    const scroll = vi.fn();
    Object.defineProperty(strip, 'scrollTo', { configurable: true, value: scroll });
    const bounds = vi.spyOn(strip, 'getBoundingClientRect').mockReturnValue(new DOMRect(23, 100, 343, 50));
    const item = vi.spyOn(active, 'getBoundingClientRect').mockReturnValue(new DOMRect(563, 100, 135, 50));
    const windowScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    strip.scrollTop = 13;
    try {
      window.dispatchEvent(new Event('resize'));
      await f.whenStable();
      expect(scroll.mock.calls).toEqual([[{ left: 332, behavior: 'instant' }]]);
      expect(strip.querySelector('.current')).toBe(active);
      expect(active.textContent).toContain('Diagnóstico');
      strip.scrollLeft = 332;
      item.mockReturnValue(new DOMRect(-28, 100, 135, 50));
      window.dispatchEvent(new Event('resize'));
      await f.whenStable();
      expect(scroll.mock.calls[1]).toEqual([{ left: 281, behavior: 'instant' }]);
      expect(strip.scrollTop).toBe(13);
      expect(windowScroll).not.toHaveBeenCalled();
      f.destroy();
      scroll.mockClear();
      window.dispatchEvent(new Event('resize'));
      expect(scroll).not.toHaveBeenCalled();
    } finally { bounds.mockRestore(); item.mockRestore(); windowScroll.mockRestore(); }
  });

  it('pagina ubicaciones grandes y oculta controles en listas pequeñas o vacías', async () => {
    const data = { headers: ['a'], rows: Array.from({ length: 11 }, (_, i) => ({ row: i + 2, values: [' '] })) };
    const { f, root, click, chooseContext, respond } = await setup(['a'], data);
    await chooseContext();
    await click('Mapear columnas');
    await click('Validar localmente');
    await respond();
    await click('Ver valores vacíos de a');
    expect(root.querySelectorAll('#missing-cell-detail tbody tr')).toHaveLength(10);
    expect(root.querySelector('#missing-cell-detail .p-paginator-rpp-dropdown')).toBeTruthy();
    await click('Ver todas las incidencias');
    expect(getComputedStyle(root.querySelector('#all-issues-detail .p-paginator')!).display).toBe('none');
    await click('Normalizar');
    expect(root.querySelector('.normalization-pager')).toBeTruthy();
    expect([...root.querySelectorAll('button')].find(button => button.textContent === 'Página siguiente')?.disabled).toBe(false);
    (root.querySelector('.checks input') as HTMLInputElement).click();
    await f.whenStable();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(10);
    expect(root.querySelector('select[aria-label="Registros por página"]')).toBeTruthy();
  });

  it('pagina más de diez campos y veinte incidencias y limpia ambos modos al cambiar entradas', async () => {
    const headers = Array.from({ length: 11 }, (_, i) => `campo${i}`);
    const data = { headers, rows: [{ row: 23, values: headers.map(() => '') }] };
    const { f, root, click, chooseContext, respond } = await setup(headers, data);
    await chooseContext();
    await click('Mapear columnas');
    await click('Validar localmente');
    DelayedWorker.all.at(-1)!.respond({ kind: 'result', changes: [], issues: Array.from({ length: 21 }, (_, i) => ({
      field: 'campo0', row: 23, description: `Incidencia ${i}`, severity: 'WARNING', context: 'system', configurationRevision: 7,
    })) });
    await f.whenStable();
    expect(root.querySelectorAll('.missing-summary tbody tr')).toHaveLength(10);
    expect(root.querySelector('.missing-summary .p-paginator-rpp-dropdown')).toBeTruthy();
    (root.querySelector('.missing-summary .p-paginator-next') as HTMLButtonElement).click();
    await f.whenStable();
    expect(root.querySelectorAll('.missing-summary tbody tr')).toHaveLength(1);
    await click('Ver todas las incidencias');
    expect(root.querySelectorAll('#all-issues-detail tbody tr')).toHaveLength(20);
    (root.querySelector('#all-issues-detail .p-paginator-next') as HTMLButtonElement).click();
    await f.whenStable();
    expect(root.querySelectorAll('#all-issues-detail tbody tr')).toHaveLength(1);
    await click('Cambiar contexto');
    await chooseContext('other');
    await click('Mapear columnas');
    await click('Validar localmente');
    await respond();
    expect(root.querySelector('#missing-cell-detail')).toBeNull();
    expect(root.querySelector('#all-issues-detail')).toBeNull();
  });

  it('conserva atrás, valores libres, limpieza, unicidad y rechazo de respuestas canceladas', async () => {
    const { f, root, click, chooseContext } = await setup();
    await chooseContext();
    await click('Mapear columnas');
    const edit = async (header: string, value: string) => {
      const field = root.querySelector<HTMLInputElement>(`input[aria-label="Mapear ${header}"]`)!;
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
      await f.whenStable();
    };
    await edit('a', 'customField');
    await edit('b', 'customField');
    expect(root.textContent).toContain('Cada campo de destino puede usarse una sola vez.');
    await click('Limpiar Mapear b');
    await click('Contexto');
    await click('Mapear columnas');
    expect(root.querySelector<HTMLInputElement>('input[aria-label="Mapear a"]')?.value).toBe('customField');
    await click('Validar localmente');
    const validation = DelayedWorker.all.at(-1)!;
    expect(validation.request).toMatchObject({ kind: 'validate', mapping: { a: 'customField', b: '' }, data: { rows: [{ row: 2, values: ['1', '2'] }] } });
    await click('Cancelar procesamiento');
    expect(validation.terminated).toBe(true);
    validation.respond({ kind: 'result', issues: [], changes: [] });
    await f.whenStable();
    expect(root.textContent).toContain('Procesamiento cancelado. No se enviaron datos al servidor.');
    expect(root.textContent).not.toContain('Descargar JSON');
    await click('Validar localmente');
    const stale = DelayedWorker.all.at(-1)!;
    await click('Contexto');
    await chooseContext('other');
    expect(stale.terminated).toBe(true);
    stale.respond({ kind: 'result', issues: [], changes: [] });
    await f.whenStable();
    expect(root.textContent).not.toContain('Descargar JSON');
  });

  it('invalida el diagnóstico y cancela generaciones cuando cambia la configuración global o falla su consulta', async () => {
    const { f, root, click, chooseContext, respond } = await setup(['a']);
    await chooseContext();
    await click('Mapear columnas');
    await click('Validar localmente');
    await respond();
    await click('Ver todas las incidencias');
    const next = { ...configurationFixture(['b']), revision: 8 };
    f.componentRef.setInput('configuration', next);
    await f.whenStable();
    expect(root.querySelector('#all-issues-detail')).toBeNull();
    expect(root.textContent).not.toContain('Descargar JSON');
    await click('Cambiar mapeo');
    await click('Validar localmente');
    const stale = DelayedWorker.all.at(-1)!;
    expect(stale.request).toMatchObject({ configuration: next });
    f.componentRef.setInput('configurationAvailable', false);
    await f.whenStable();
    expect(stale.terminated).toBe(true);
    stale.respond({ kind: 'result', issues: [], changes: [] });
    await f.whenStable();
    expect(root.textContent).not.toContain('Descargar JSON');
  });

  it('rechaza respuestas de una revisión anterior y nunca envía datos biológicos por HTTP', async () => {
    const http = vi.fn(); vi.stubGlobal('fetch', http);
    const { f, root, click, chooseContext, respond } = await setup(['a']);
    await chooseContext(); await click('Mapear columnas'); await click('Validar localmente');
    const stale = DelayedWorker.all.at(-1)!;
    f.componentRef.setInput('configuration', { ...configurationFixture(['b']), revision: 42 });
    await f.whenStable();
    expect(stale.terminated).toBe(true);
    stale.respond({ kind: 'result', issues: [{ field: 'a', row: 2, severity: 'ERROR', description: 'Obsoleto', context: 'collection', configurationRevision: 7 }], changes: [] });
    await f.whenStable();
    expect(root.textContent).not.toContain('Descargar JSON');
    await click('Validar localmente');
    expect(DelayedWorker.all.at(-1)!.request).toMatchObject({ configuration: { revision: 42 } });
    await respond(); await click('Normalizar');
    expect(http).not.toHaveBeenCalled();
  });

  it('alcanza la última fila, cambia tamaños y pagina con mensajes pequeños sobre un único original', async () => {
    const data = { headers: ['eventDate'], rows: Array.from({ length: 31 }, (_, i) => ({ row: i * 3 + 7, values: ['2024/02/29'] })) };
    const original = JSON.stringify(data);
    const { f, root, click, preview, toggle } = await normalization(data);
    expect(root.querySelectorAll('.normalization-grid tbody tr')).toHaveLength(10);
    expect(root.textContent).toContain('Comprobación de duplicados desactivada');
    await click('Última página');
    expect(root.querySelectorAll('.normalization-grid tbody tr')).toHaveLength(1);
    expect(root.querySelector('.normalization-grid tbody th')?.textContent?.trim()).toBe('97');
    expect(preview.request).toMatchObject({ kind: 'preview-page', window: { offset: 30, limit: 10 } });
    const size = root.querySelector<HTMLSelectElement>('select[aria-label="Registros por página"]')!;
    for (const limit of [25, 50, 100, 10]) {
      size.value = String(limit); size.dispatchEvent(new Event('change')); await f.whenStable();
      expect(root.querySelectorAll('.normalization-grid tbody tr')).toHaveLength(Math.min(limit, 31));
    }
    await toggle('Fechas Darwin Core');
    expect(root.querySelector('.normalization-grid tbody')?.textContent).toContain('2024-02-29');
    await toggle('Fechas Darwin Core');
    expect(root.querySelector('.normalization-grid tbody')?.textContent).toContain('2024/02/29');
    expect(preview.requests.filter(request => request.kind === 'preview-init')).toHaveLength(1);
    expect(preview.requests.slice(1).every(request => !('original' in request) && !('data' in request) && !('mapping' in request))).toBe(true);
    expect(JSON.stringify(data)).toBe(original);
  });

  it('filtra las 500 columnas por metadata actual sin perder índices ni registros totalmente ocultos', async () => {
    const data = { headers: Array.from({ length: 500 }, (_, i) => `col${i}`), rows: [{ row: 42, values: Array.from({ length: 500 }, (_, i) => i === 499 ? 'NULL' : ' ') }] };
    const { root, preview, toggle, click } = await normalization(data);
    await click('Columnas siguientes');
    expect(preview.request).toMatchObject({ kind: 'preview-page', window: { columnIndices: Array.from({ length: 50 }, (_, i) => i + 50) } });
    await toggle('Ocultar columnas sin datos (solo vista)');
    expect(preview.request).toMatchObject({ kind: 'preview-page', window: { columnIndices: [499] } });
    expect(root.querySelectorAll('.normalization-grid thead th')).toHaveLength(2);
    expect(root.querySelector('.normalization-grid thead')?.textContent).toContain('Columna 500');
    await toggle('Tratar NULL y N/A como vacíos (sin distinguir mayúsculas)');
    expect(root.textContent).toContain('Todas las columnas están ocultas');
    expect(root.querySelectorAll('.normalization-grid tbody tr')).toHaveLength(1);
    expect(root.querySelectorAll('.normalization-grid td')).toHaveLength(0);
    expect(preview.request).toMatchObject({ kind: 'preview-page', window: { columnIndices: [] } });
    await toggle('Ocultar columnas sin datos (solo vista)');
    expect(root.querySelectorAll('.normalization-grid td')).toHaveLength(50);
    expect(data.rows[0].values[499]).toBe('NULL');
  });

  it('muestra índices no contiguos y dos avisos superpuestos con sus filas físicas fuera de página', async () => {
    const data = { headers: ['occurrenceID', 'vacía', 'eventDate'], rows: Array.from({ length: 12 }, (_, i) => ({ row: i * 4 + 2, values: ['ID', '', '2024'] })) };
    const { root, preview, toggle } = await normalization(data);
    await toggle('Comprobar duplicados'); await toggle('Ocultar columnas sin datos (solo vista)');
    expect(preview.request).toMatchObject({ kind: 'preview-page', window: { columnIndices: [0, 2] } });
    expect(root.textContent).toContain('Filas completas iguales: 1 grupos · 12 registros');
    expect(root.textContent).toContain('occurrenceID repetido: 1 grupos · 12 registros');
    expect(root.textContent).toContain('no se suman como registros únicos');
    expect(root.querySelector('.normalization-duplicates')?.textContent).toContain('46');
    await toggle('Comprobar duplicados');
    expect(root.querySelector('.normalization-duplicates')?.textContent).toContain('desactivada');
    expect(root.querySelector('.normalization-duplicates')?.textContent).not.toContain('0 grupos');
  });

  it('presenta reglas y espacios visibles, texto exacto seguro y un panel por foco, hover y toque con Escape', async () => {
    const before = ' <img src=x>\t\n ';
    const { f, root, toggle, click } = await normalization({ headers: ['a', 'b'], rows: [{ row: 19, values: [before, 'x'] }] });
    await toggle('Eliminar espacios al inicio y al final');
    const cell = root.querySelector<HTMLButtonElement>('.normalization-changed button')!;
    expect(cell.textContent).toContain('Espacios exteriores');
    cell.dispatchEvent(new MouseEvent('mouseenter')); await f.whenStable();
    expect(root.querySelector('.normalization-original dd')?.textContent).toBe(before);
    expect(root.querySelector('.normalization-original')?.textContent).toContain('␠<img␠src=x>⇥↵␠');
    expect(root.querySelector('.normalization-original img')).toBeNull();
    expect(cell.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelectorAll('#' + cell.getAttribute('aria-controls'))).toHaveLength(1);
    await click('Cerrar original');
    expect(document.activeElement).toBe(cell);
    expect(root.querySelector('.normalization-original')).toBeNull();
    cell.dispatchEvent(new FocusEvent('focus')); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeNull();
    cell.click(); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeTruthy();
    cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeNull();
    cell.dispatchEvent(new FocusEvent('blur')); cell.dispatchEvent(new FocusEvent('focus')); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeTruthy();
    cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await f.whenStable();
    expect(root.querySelectorAll('.normalization-grid button[tabindex="0"]')).toHaveLength(1);
    expect((document.activeElement as HTMLElement).dataset['cell']).toBe('19:1');
    await toggle('Eliminar espacios al inicio y al final');
    expect(root.querySelector('.normalization-original')).toBeNull();
    expect(root.querySelectorAll('.normalization-changed')).toHaveLength(0);
  });

  it('F1 cierra el original con Escape desde Aplicar sin robar foco y respeta la vista inactiva', async () => {
    const { f, root, toggle, button } = await normalization({ headers: ['scientificName'], rows: [{ row: 2, values: [' Aus bus '] }] });
    await toggle('Eliminar espacios al inicio y al final');
    const apply = button('Aplicar normalización y validar');
    const cell = root.querySelector<HTMLButtonElement>('.normalization-changed button')!;
    apply.focus();
    cell.dispatchEvent(new MouseEvent('mouseenter')); await f.whenStable();
    expect(root.querySelector('.normalization-original dd')?.textContent).toBe(' Aus bus ');
    expect(document.activeElement).toBe(apply);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    apply.dispatchEvent(escape); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeNull();
    expect(document.activeElement).toBe(apply);
    expect(escape.defaultPrevented).toBe(false);
    expect(cell.getAttribute('aria-expanded')).toBe('false');
    await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeNull();
    cell.click(); await f.whenStable();
    const close = button('Cerrar original');
    close.focus(); close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeNull();
    expect(document.activeElement).toBe(cell);
    cell.dispatchEvent(new FocusEvent('focus')); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeNull();
    f.componentRef.setInput('active', false); await f.whenStable();
    apply.focus();
    cell.dispatchEvent(new MouseEvent('mouseenter')); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeNull();
    apply.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await f.whenStable();
    expect(document.activeElement).toBe(apply);
  });

  it('F3 vincula el footer de acciones de 44px solo al paso Normalizar', async () => {
    const { root, click } = await normalization({ headers: ['a'], rows: [{ row: 2, values: ['x'] }] });
    const footer = root.querySelector('.wizard-footer.normalization-footer');
    expect(footer).toBeTruthy();
    expect([...footer!.querySelectorAll('button')].map(button => button.textContent?.trim())).toEqual([
      'Ver diagnóstico', 'Aplicar normalización y validar', 'Finalizar',
    ]);
    await click('Ver diagnóstico');
    expect(root.querySelector('.wizard-footer')).toBeTruthy();
    expect(root.querySelector('.normalization-footer')).toBeNull();
    await click('Contexto');
    expect(root.querySelector('.wizard-footer')).toBeTruthy();
    expect(root.querySelector('.normalization-footer')).toBeNull();
    await click('Mapear columnas');
    expect(root.querySelector('.wizard-footer')).toBeTruthy();
    expect(root.querySelector('.normalization-footer')).toBeNull();
  });

  it('descarta ready y páginas atrasadas, ignora respuestas desconocidas y etiqueta la copia anterior', async () => {
    const { f, root, preview, toggle, button } = await normalization({ headers: ['a'], rows: [{ row: 2, values: [' x '] }] });
    DelayedWorker.previewAutomatic = false;
    await toggle('Eliminar espacios al inicio y al final');
    const older = preview.request as PreviewRequest;
    await toggle('Eliminar espacios al inicio y al final');
    const current = preview.request as PreviewRequest;
    expect(root.textContent).toContain('copia anterior, no vigente');
    expect(button('Aplicar normalización y validar').disabled).toBe(true);
    preview.answerPreview(older); await f.whenStable();
    expect(button('Aplicar normalización y validar').disabled).toBe(true);
    preview.emitPreview({ kind: 'foreign', session: current.session, generation: current.generation, id: current.id });
    preview.answerPreview(current); await f.whenStable();
    expect(button('Aplicar normalización y validar').disabled).toBe(false);
    preview.emitPreview({ ...current, kind: 'preview-page', id: older.id, rows: [], window: { offset: 0, limit: 10, columnIndices: [0] } });
    await f.whenStable();
    expect(root.querySelectorAll('.normalization-grid tbody tr')).toHaveLength(1);
  });

  it('no invalida el análisis al paginar u ocultar; las opciones sí cancelan y Apply captura todos los flags', async () => {
    const { f, root, preview, toggle, click } = await normalization({ headers: ['a'], rows: Array.from({ length: 12 }, (_, i) => ({ row: i + 2, values: [' x '] })) });
    for (const name of ['Eliminar espacios al inicio y al final', 'Tratar NULL y N/A como vacíos (sin distinguir mayúsculas)', 'Fechas Darwin Core', 'Coordenadas decimales', 'Valores numéricos Darwin Core', 'Comprobar duplicados']) await toggle(name);
    for (const [label, value] of [['Interpretación de fechas', 'DMY'], ['Separador decimal', 'comma']]) {
      const select = [...root.querySelectorAll('label')].find(item => item.textContent?.startsWith(label))!.querySelector('select')!;
      select.value = value; select.dispatchEvent(new Event('change')); await f.whenStable();
    }
    await click('Aplicar normalización y validar');
    const analysis = DelayedWorker.all.filter(worker => !worker.previewRole).at(-1)!;
    expect(analysis.request).toMatchObject({ kind: 'validate', options: { trim: true, emptyMarkers: true, dates: true, coordinates: true, numbers: true, duplicates: true, dateOrder: 'DMY', decimalMode: 'comma' } });
    await click('Página siguiente'); await toggle('Ocultar columnas sin datos (solo vista)');
    expect(analysis.terminated).toBe(false);
    expect(preview.terminated).toBe(false);
    await toggle('Fechas Darwin Core');
    expect(analysis.terminated).toBe(true);
    analysis.respond({ kind: 'result', issues: [], changes: [] }); await f.whenStable();
    expect(root.querySelector('.wizard-final')).toBeNull();
    expect([...root.querySelectorAll<HTMLButtonElement>('.steps button')][5].disabled).toBe(true);
  });

  it.each(['contexto', 'revisión', 'configuración', 'disponibilidad', 'términos'])('frontera metadatos-preview: %s invalida solo el diagnóstico y las opciones sí recalculan', async (change) => {
    const data = { headers: ['a'], rows: [{ row: 19, values: [' original '] }] };
    const { f, root, preview, toggle, click, chooseContext, button, respond } = await normalization(data);
    const snapshotText = root.querySelector('.normalization-grid')!.textContent;
    const initialRequest = structuredClone(preview.request);
    const previewMessages = preview.requests.length;
    expect(button('Aplicar normalización y validar').disabled).toBe(false);
    await click('Aplicar normalización y validar');
    const analysis = DelayedWorker.all.filter(worker => !worker.previewRole).at(-1)!;
    expect(analysis.request.kind).toBe('validate');
    expect(analysis.terminated).toBe(false);
    DelayedWorker.previewAutomatic = false;
    if (change === 'contexto') {
      await click('Contexto'); await chooseContext('other');
    } else if (change === 'revisión') {
      f.componentRef.setInput('configuration', { ...configurationFixture([]), revision: 8 });
    } else if (change === 'configuración') {
      f.componentRef.setInput('configuration', configurationFixture(['a']));
    } else if (change === 'disponibilidad') {
      f.componentRef.setInput('configurationAvailable', false);
    } else {
      f.componentRef.setInput('terms', [{ name: 'a', uri: 'https://example.org/a', definition: 'Metadata', category: '', status: 'recommended' }]);
    }
    await f.whenStable();
    expect(analysis.terminated).toBe(true);
    expect([...root.querySelectorAll<HTMLButtonElement>('.steps button')][5].disabled).toBe(true);
    analysis.respond({ kind: 'result', issues: [], changes: [] }); await f.whenStable();
    expect([...root.querySelectorAll<HTMLButtonElement>('.steps button')][5].disabled).toBe(true);
    expect(preview.requests).toHaveLength(previewMessages);
    expect(preview.terminated).toBe(false);
    if (change === 'disponibilidad') {
      f.componentRef.setInput('configurationAvailable', true); await f.whenStable();
      expect(preview.requests).toHaveLength(previewMessages);
    }
    await click('Mapear columnas'); await click('Validar localmente'); await respond(); await click('Normalizar');
    expect(preview.requests).toHaveLength(previewMessages);
    expect(preview.request).toEqual(initialRequest);
    expect(root.querySelector('.normalization-grid')!.textContent).toBe(snapshotText);
    expect(button('Aplicar normalización y validar').disabled).toBe(false);
    expect(root.textContent).not.toContain('copia anterior, no vigente');
    await click('Aplicar normalización y validar');
    const pending = DelayedWorker.all.filter(worker => !worker.previewRole).at(-1)!;
    await toggle('Eliminar espacios al inicio y al final');
    expect(pending.terminated).toBe(true);
    expect(preview.requests).toHaveLength(previewMessages + 1);
    expect(preview.request).toMatchObject({ kind: 'preview-update', options: { trim: true } });
    expect(preview.request).not.toHaveProperty('original');
    expect(button('Aplicar normalización y validar').disabled).toBe(true);
    pending.respond({ kind: 'result', issues: [], changes: [] }); await f.whenStable();
    expect([...root.querySelectorAll<HTMLButtonElement>('.steps button')][5].disabled).toBe(true);
    preview.answerPreview(); await f.whenStable();
    expect(button('Aplicar normalización y validar').disabled).toBe(false);
    expect(root.querySelector('.normalization-grid tbody')!.textContent).toContain('original');
    root.querySelector<HTMLButtonElement>('.normalization-changed button')!.click(); await f.whenStable();
    expect(root.querySelector('.normalization-original dd')!.textContent).toBe(' original ');
    expect(data.rows[0].values[0]).toBe(' original ');
  });

  it('rechaza una página atrasada de la misma generación y cierra el original al cambiar ventana', async () => {
    const { f, root, preview, toggle, click } = await normalization({ headers: ['a', 'vacía'], rows: Array.from({ length: 12 }, (_, i) => ({ row: i + 2, values: [' x ', ''] })) });
    await toggle('Eliminar espacios al inicio y al final');
    root.querySelector<HTMLButtonElement>('.normalization-changed button')!.click(); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeTruthy();
    DelayedWorker.previewAutomatic = false;
    await click('Página siguiente');
    const older = preview.request as PreviewRequest;
    expect(root.querySelector('.normalization-original')).toBeNull();
    await toggle('Ocultar columnas sin datos (solo vista)');
    const latest = preview.request as PreviewRequest;
    preview.answerPreview(older); await f.whenStable();
    expect(root.textContent).toContain('Cargando ventana');
    preview.answerPreview(latest); await f.whenStable();
    expect(root.textContent).not.toContain('Cargando ventana');
    expect(root.querySelectorAll('.normalization-grid thead th')).toHaveLength(2);
    expect(latest.generation).toBe(older.generation);
    expect(latest.id).toBeGreaterThan(older.id);
  });

  it('usa el campo DwC mapeado como cabecera y muestra el origen secundario solo si difiere', async () => {
    const { f, root, click, chooseContext, respond } = await setup([], { headers: ['Fecha', 'a'], rows: [{ row: 24, values: ['2024/02/29', 'x'] }] });
    await chooseContext(); await click('Mapear columnas');
    const input = root.querySelector<HTMLInputElement>('input[aria-label="Mapear Fecha"]')!;
    input.value = 'eventDate'; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })); await f.whenStable();
    await click('Validar localmente'); await respond(); await click('Normalizar');
    const headers = root.querySelectorAll('.normalization-grid thead th');
    expect(headers[1].querySelector('strong')?.textContent).toBe('eventDate');
    expect(headers[1].querySelector('small.literal')?.textContent).toBe('Fecha');
    expect(headers[1].getAttribute('title')).toBe('Columna 1: Fecha');
    expect(headers[2].querySelector('small.literal')).toBeNull();
    (root.querySelectorAll('.checks input')[5] as HTMLInputElement).click(); await f.whenStable();
    expect(root.textContent).toContain('Sin occurrenceID mapeado; se comprobaron las filas completas');
  });

  it('conserva originales ante onerror, no reintenta automáticamente y reinicia init fallido con tokens nuevos', async () => {
    DelayedWorker.previewAutomatic = false;
    const data = { headers: ['a'], rows: [{ row: 2, values: [' x '] }] };
    const { f, root, preview, click, toggle, button } = await normalization(data);
    const failed = preview.request as PreviewRequest;
    preview.onerror?.(); await f.whenStable();
    expect(root.textContent).toContain('Los originales se conservan');
    expect(button('Aplicar normalización y validar').disabled).toBe(true);
    await toggle('Eliminar espacios al inicio y al final');
    expect(preview.requests).toHaveLength(1);
    await click('Reintentar vista previa');
    const next = DelayedWorker.all.filter(worker => worker.previewRole).at(-1)!;
    expect(next).not.toBe(preview);
    expect(next.request).toMatchObject({ kind: 'preview-init', original: data, options: { trim: true } });
    expect((next.request as PreviewRequest).session).toBeGreaterThan(failed.session);
    preview.answerPreview(failed); preview.onerror?.(); await f.whenStable();
    expect(root.textContent).toContain('Calculando todos');
    next.answerPreview(); await f.whenStable();
    expect(button('Aplicar normalización y validar').disabled).toBe(false);
    expect(data.rows[0].values[0]).toBe(' x ');
    f.destroy(); expect(next.terminated).toBe(true);
  });

  it('cancela, reintenta y termina el worker al cambiar archivo sin aceptar eventos viejos', async () => {
    const { f, root, preview, toggle, click } = await normalization({ headers: ['a'], rows: [{ row: 2, values: [' x '] }] });
    DelayedWorker.previewAutomatic = false;
    await toggle('Eliminar espacios al inicio y al final');
    const stale = preview.request as PreviewRequest;
    await click('Cancelar vista previa');
    expect(preview.request.kind).toBe('preview-cancel');
    preview.answerPreview(stale); await f.whenStable();
    expect(root.textContent).toContain('Vista previa cancelada');
    await click('Reintentar vista previa');
    expect(preview.request.kind).toBe('preview-update');
    preview.answerPreview(); await f.whenStable();
    await click('Cambiar archivo');
    const input = root.querySelector('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [new File(['b\ny'], 'nuevo.csv')] }); input.dispatchEvent(new Event('change')); await f.whenStable();
    expect(preview.terminated).toBe(true);
    preview.onerror?.(); preview.answerPreview(stale); await f.whenStable();
    expect(root.textContent).not.toContain('No se pudo calcular');
    expect(root.querySelector('.normalization-grid')).toBeNull();
  });

  it('ensancha solo Normalizar activo y conserva el workbench y worker al navegar por el menú', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['catalog'], []);
    client.setQueryData(['validation-configuration'], configurationFixture([]));
    TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual, providers: [provideTanStackQuery(client), { provide: Api, useValue: {
      catalog: async () => [], validationConfiguration: async () => configurationFixture([]),
    } }], imports: [App] });
    await TestBed.compileComponents();
    const f = TestBed.createComponent(App); await f.whenStable();
    const blocks = await f.getDeferBlocks();
    await blocks[0].render(DeferBlockState.Complete); await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    const click = async (name: string) => {
      const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === name || item.textContent?.replace(/^\s*\d+\s*/, '').trim() === name);
      expect(button, name).toBeTruthy(); button!.click(); await f.whenStable();
    };
    const input = root.querySelector('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [new File(['a\nx'], 'shell.csv')] }); input.dispatchEvent(new Event('change')); await f.whenStable();
    DelayedWorker.all.filter(worker => !worker.previewRole).at(-1)!.respond({ kind: 'parsed', data: { headers: ['a'], rows: [{ row: 2, values: [' x '] }] } }); await f.whenStable();
    (root.querySelector('.context-grid input[value=collection]') as HTMLInputElement).click(); await f.whenStable();
    await click('Mapear columnas'); await click('Validar localmente');
    DelayedWorker.all.filter(worker => !worker.previewRole).at(-1)!.respond({ kind: 'result', issues: [], changes: [] }); await f.whenStable();
    expect(root.querySelector('main')?.classList.contains('normalization-wide')).toBe(false);
    await click('Normalizar');
    expect(root.querySelector('main')?.classList.contains('normalization-wide')).toBe(true);
    const workbench = root.querySelector('app-import');
    const preview = DelayedWorker.all.filter(worker => worker.previewRole).at(-1)!;
    (root.querySelector('.checks input') as HTMLInputElement).click(); await f.whenStable();
    root.querySelector<HTMLButtonElement>('.normalization-changed button')!.click(); await f.whenStable();
    expect(root.querySelector('.normalization-original')).toBeTruthy();
    await click('▦ Catálogo Darwin Core');
    expect(root.querySelector('main')?.classList.contains('normalization-wide')).toBe(false);
    expect(root.querySelector('.normalization-original')).toBeNull();
    expect(root.querySelector('app-import')).toBe(workbench);
    expect(preview.terminated).toBe(false);
    await click('☷ Fuentes de registros biológicos');
    expect(root.querySelector('main')?.classList.contains('normalization-wide')).toBe(false);
    await click('▤ Análisis de colecciones');
    expect(root.querySelector('main')?.classList.contains('normalization-wide')).toBe(true);
    expect(root.querySelector('app-import')).toBe(workbench);
    expect(preview.requests.filter(request => request.kind === 'preview-init')).toHaveLength(1);
    f.destroy(); expect(preview.terminated).toBe(true);
  });

  it('explains which workbook sheet to analyze and reads the selected sheet locally', async () => {
    const f = TestBed.createComponent(ImportWorkbench);
    f.componentRef.setInput('configuration', configurationFixture([]));
    f.componentRef.setInput('terms', []);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    const input = root.querySelector('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [new File(['isolated workbook'], 'original.xlsx')] });
    input.dispatchEvent(new Event('change'));
    await f.whenStable();
    DelayedWorker.all.at(-1)!.respond({ kind: 'sheets', sheets: ['Inventario', 'Observaciones'] });
    await f.whenStable();
    const label = [...root.querySelectorAll('label')].find(l => l.querySelector('select'))!;
    expect(label.textContent).toContain('Seleccione la hoja de cálculo que desea analizar');
    expect([...label.querySelectorAll('option')].map(o => o.textContent?.trim())).toEqual(['Inventario', 'Observaciones']);
    [...root.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Leer la hoja seleccionada')!.click();
    await f.whenStable();
    expect(DelayedWorker.all.at(-1)!.request).toMatchObject({ kind: 'parse', sheet: 'Inventario' });
  });
});
