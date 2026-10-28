import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ImportWorkbench } from './import-workbench';
import { configurationFixture } from '../../../testing/validation-fixture';
import type { Dataset } from '../models/dataset';
import type { WorkerRequest, WorkerResponse } from '../models/worker-protocol';

type ResponseBody<T = WorkerResponse> = T extends WorkerResponse ? Omit<T, 'id'> : never;
class DelayedWorker {
  static all: DelayedWorker[] = [];
  onmessage?: (event: MessageEvent<WorkerResponse>) => void;
  request!: WorkerRequest;
  terminated = false;
  constructor() { DelayedWorker.all.push(this); }
  postMessage(request: WorkerRequest) { this.request = request; }
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

describe('Preservación pública del análisis local', () => {
  beforeEach(() => {
    DelayedWorker.all = [];
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
    expect(getComputedStyle(root.querySelector('.p-paginator')!).display).toBe('none');
    (root.querySelector('.checks input') as HTMLInputElement).click();
    await f.whenStable();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(10);
    expect(root.querySelector('.p-paginator-rpp-dropdown')).toBeTruthy();
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
