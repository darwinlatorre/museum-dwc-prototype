import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { CatalogMetadata } from '../features/catalog/services/catalog-metadata';
import { Catalog } from '../features/catalog/pages/catalog/catalog';
import { ImportWorkbench } from '../features/importer/pages/import-workbench/import-workbench';
import type { Term } from '../features/catalog/models/catalog-term';
import type { WorkerRequest } from '../features/importer/models/worker-protocol';
import type { PreviewRequest } from '../features/importer/models/normalization-preview';
import type { Dataset } from '../features/importer/models/dataset';
import { buildNormalizationPreview, readPreviewPage, type PreviewSnapshot } from '../features/importer/engine/normalization-preview';
import { configurationFixture } from './validation-fixture';

const terms: Term[] = [
  { name: 'catalogNumber', uri: 'https://example.org/catalogNumber', definition: 'Original definition', category: 'http://rs.tdwg.org/dwc/terms/Occurrence', status: 'recommended' },
  { name: 'otherCatalogNumbers', uri: 'https://example.org/otherCatalogNumbers', definition: 'Other numbers', category: 'http://rs.tdwg.org/dwc/terms/Occurrence', status: 'deprecated' },
  { name: 'eventDate', uri: 'https://example.org/eventDate', definition: 'Date', category: '', status: 'recommended' },
];
const configuration = configurationFixture(['eventDate']);
const issues = [
  { field: 'catalogNumber', row: 2, description: 'Original error', severity: 'ERROR', context: 'collection', configurationRevision: 7 },
  { field: 'raw', row: null, description: 'Original warning', severity: 'WARNING', context: 'system', configurationRevision: 7 },
];
let requests: WorkerRequest[];
let scrollIntoViewDescriptor: PropertyDescriptor | undefined;
class LocalWorker {
  onmessage?: (event: MessageEvent) => void;
  terminate() {}
  private original?: Dataset;
  private snapshot?: PreviewSnapshot;
  postMessage(request: WorkerRequest | PreviewRequest) {
    if (request.kind === 'preview-cancel') return;
    if (request.kind === 'preview-init' || request.kind === 'preview-update' || request.kind === 'preview-page') {
      if (request.kind === 'preview-init') this.original = structuredClone(request.original);
      if (request.kind !== 'preview-page') this.snapshot = buildNormalizationPreview(this.original!, {}, request.options);
      const data = { ...request, kind: request.kind === 'preview-page' ? 'preview-page' : 'preview-ready', metadata: this.snapshot!.metadata, ...readPreviewPage(this.snapshot!, request.window) };
      queueMicrotask(() => this.onmessage?.({ data } as MessageEvent));
      return;
    }
    requests.push(request);
    queueMicrotask(() => this.onmessage?.({ data: request.kind === 'parse'
      ? { id: request.id, kind: 'parsed', data: { headers: ['catalog', 'raw', 'eventDate'], rows: [{ row: 2, values: ['  original  ', 'N/A', ''] }] } }
      : { id: request.id, session: request.session, generation: request.generation, kind: 'result', changes: [], issues,
        duplicates: { equalRows: { groups: 0, affectedRows: 0 }, occurrenceIds: { groups: 0, affectedRows: 0 } } } } as MessageEvent));
  }
}
const button = (root: ParentNode, name: string) => {
  const found = [...root.querySelectorAll('button')].find(b => b.textContent?.trim() === name || b.getAttribute('aria-label') === name);
  expect(found, name).toBeTruthy();
  return found as HTMLButtonElement;
};
const field = (root: ParentNode, name: string) => {
  const found = [...root.querySelectorAll('label')].find(label => {
    const copy = label.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('input,select,textarea').forEach(control => control.remove());
    return copy.textContent?.trim() === name;
  });
  expect(found, name).toBeTruthy();
  return found!.querySelector('input,select,textarea') as HTMLInputElement;
};
async function change(f: ComponentFixture<unknown>, control: HTMLInputElement, value: string) {
  control.value = value;
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
  await f.whenStable();
}
async function click(f: ComponentFixture<unknown>, name: string) {
  button(f.nativeElement, name).click(); await f.whenStable();
}
async function workbench() {
  const f = TestBed.createComponent(ImportWorkbench);
  f.componentRef.setInput('terms', terms);
  f.componentRef.setInput('configuration', configuration);
  await f.whenStable();
  const input = f.nativeElement.querySelector('input[type=file]');
  Object.defineProperty(input, 'files', { value: [new File(['catalog,raw\n  original  ,N/A'], 'isolated.csv')] });
  input.dispatchEvent(new Event('change')); await f.whenStable();
  (f.nativeElement.querySelector('.context-grid input[value=collection]') as HTMLInputElement).click();
  await f.whenStable(); await click(f, 'Mapear columnas');
  return f;
}

describe('Evolución de los controles públicos', () => {
  beforeEach(() => {
    // jsdom no implementa el desplazamiento que PrimeNG invoca al abrir el selector.
    scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, writable: true, value: vi.fn() });
    requests = [];
    vi.stubGlobal('Worker', LocalWorker);
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
    TestBed.configureTestingModule({ providers: [provideTanStackQuery(new QueryClient()), { provide: CatalogMetadata, useValue: {} }] });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    if (scrollIntoViewDescriptor) Object.defineProperty(Element.prototype, 'scrollIntoView', scrollIntoViewDescriptor);
    else Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    vi.unstubAllGlobals();
  });

  it('oculta paginadores innecesarios en normalización y diagnóstico sin cambiar el resultado completo', async () => {
    const f = await workbench();
    await click(f, 'Validar localmente'); await click(f, 'Normalizar');
    expect(button(f.nativeElement, 'Página siguiente').disabled).toBe(true);
    expect(f.nativeElement.querySelectorAll('.normalization-grid tbody tr')).toHaveLength(1);
    await click(f, 'Ver diagnóstico'); await click(f, 'Ver todas las incidencias');
    expect(getComputedStyle(f.nativeElement.querySelector('#all-issues-detail .p-paginator')).display).toBe('none');
    expect(f.componentInstance.issues()).toEqual(issues);
  });

  it('elige exactamente un contexto y conserva registros y opciones en el worker', async () => {
    const f = await workbench(); await click(f, 'Atrás');
    const root = f.nativeElement as HTMLElement;
    for (const radio of root.querySelectorAll<HTMLInputElement>('.context-grid input')) {
      radio.click(); await f.whenStable();
      expect(root.querySelectorAll('.context-grid input:checked')).toHaveLength(1);
    }
    await click(f, 'Mapear columnas'); await click(f, 'Validar localmente');
    expect(requests.at(-1)).toMatchObject({ kind: 'validate', context: 'other', configuration,
      options: { trim: false, emptyMarkers: false }, data: { rows: [{ row: 2, values: ['  original  ', 'N/A', ''] }] } });
    expect((requests.at(-1) as Extract<WorkerRequest, { kind: 'validate' }>).options).toEqual({ trim: false, emptyMarkers: false });
  });

  it('resalta el origen, sincroniza sugerencias con selector y limpiar, y conserva destinos únicos', async () => {
    const f = await workbench(); const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('th[scope=row]')?.textContent).toContain('catalog');
    await click(f, 'catalogNumber');
    expect(button(root, 'catalogNumber').getAttribute('aria-pressed')).toBe('true');
    expect(button(root, 'otherCatalogNumbers').getAttribute('aria-pressed')).toBe('false');
    await click(f, 'Limpiar Mapear catalog');
    expect(button(root, 'catalogNumber').getAttribute('aria-pressed')).toBe('false');
    const picker = root.querySelector<HTMLInputElement>('input[aria-label="Mapear catalog"]')!;
    (picker.closest('p-select')!.querySelector('[role=button]') as HTMLElement).click(); await f.whenStable();
    expect(document.querySelector('input[role=searchbox]')).toBeNull();
    expect(picker.closest('app-dwc-picker')!.querySelectorAll('input')).toHaveLength(1);
    await change(f, picker, 'otherCatalog');
    expect([...document.querySelectorAll('[role=option]')].map(o => o.textContent?.trim())).toEqual(['otherCatalogNumbers']);
    (document.querySelector('[role=option]') as HTMLElement).click(); await f.whenStable();
    expect(button(root, 'otherCatalogNumbers').getAttribute('aria-pressed')).toBe('true');
    await click(f, 'catalogNumber');
    await change(f, root.querySelector('input[aria-label="Mapear raw"]')!, 'catalogNumber');
    expect(root.textContent).toContain('Cada campo de destino puede usarse una sola vez.');
    expect(button(root, 'Validar localmente').disabled).toBe(true);
    await click(f, 'Limpiar Mapear raw');
    expect(button(root, 'Validar localmente').disabled).toBe(false);
  });

  it('permite volver por seis pasos sin perder archivo, mapeo, contexto ni diagnóstico', async () => {
    const f = await workbench(); const root = f.nativeElement as HTMLElement;
    const step = (i: number) => root.querySelectorAll<HTMLButtonElement>('.steps button')[i];
    expect(root.querySelectorAll('.steps button')).toHaveLength(6);
    expect(step(5).disabled).toBe(true);
    await click(f, 'catalogNumber'); await click(f, 'Validar localmente');
    const count = requests.length;
    step(0).click(); await f.whenStable();
    expect(root.querySelector('input[type=file]')).toBeTruthy();
    step(2).click(); await f.whenStable();
    expect(button(root, 'catalogNumber').getAttribute('aria-pressed')).toBe('true');
    step(1).click(); await f.whenStable();
    expect(field(root, 'Colección biológica.').checked).toBe(true);
    step(3).click(); await f.whenStable(); await click(f, 'Ver todas las incidencias');
    expect(root.textContent).toContain('Original error'); expect(root.textContent).toContain('isolated.csv');
    expect(step(3).getAttribute('aria-current')).toBe('step'); expect(requests).toHaveLength(count);
    step(1).click(); await f.whenStable();
    (root.querySelector('.context-grid input[value=other]') as HTMLInputElement).click(); await f.whenStable();
    expect([3, 4, 5].every(i => step(i).disabled)).toBe(true);
  });

  it('bloquea el progreso sin archivo y con destinos repetidos', async () => {
    const empty = TestBed.createComponent(ImportWorkbench);
    empty.componentRef.setInput('terms', terms); empty.componentRef.setInput('configuration', configuration);
    await empty.whenStable();
    expect([...(empty.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.steps button')].slice(1).every(b => b.disabled)).toBe(true);
    const f = await workbench(); await click(f, 'catalogNumber');
    await change(f, f.nativeElement.querySelector('input[aria-label="Mapear raw"]'), 'catalogNumber');
    expect([...(f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.steps button')].slice(3).every(b => b.disabled)).toBe(true);
  });

  it('distingue errores por texto y conserva las descargas completas al filtrar', async () => {
    const f = await workbench(); await click(f, 'Validar localmente'); await click(f, 'Ver todas las incidencias');
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('tr.issue-error')?.textContent).toContain('Error');
    expect(root.querySelector('tr.issue-error strong')?.textContent).toBe('Original error');
    await change(f, field(root, 'Severidad'), 'WARNING');
    expect(root.textContent).not.toContain('Original error'); expect(root.textContent).toContain('Original warning');
    let blob: Blob | undefined;
    vi.stubGlobal('URL', { createObjectURL: (value: Blob) => { blob = value; return 'blob:isolated'; }, revokeObjectURL() {} });
    const anchor = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await click(f, 'Descargar JSON');
    const text = await new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsText(blob!); });
    expect(JSON.parse(text)).toEqual(issues); anchor.mockRestore();
  });

  it('compone búsqueda, categoría canónica y estado, muestra categorías legibles y restablece', async () => {
    const f = TestBed.createComponent(Catalog); f.componentRef.setInput('terms', terms); await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    const category = field(root, 'Categoría');
    expect([...category.querySelectorAll('option')].find(o => o.textContent === 'Occurrence')?.value).toBe(terms[0].category);
    expect(root.textContent).toContain('Sin categoría');
    await change(f, category, terms[0].category); await change(f, field(root, 'Estado'), 'deprecated');
    await change(f, field(root, 'Buscar en todos los atributos'), 'otherCatalog');
    expect(root.textContent).toContain('Other numbers'); expect(root.textContent).not.toContain('Original definition');
    await change(f, field(root, 'Buscar en todos los atributos'), 'eventDate');
    expect(root.textContent).toContain('Ningún término coincide'); await click(f, 'Restablecer filtros');
    expect(root.textContent).toContain('Original definition'); expect(root.textContent).toContain('Other numbers');
    expect(terms[0].category).toBe('http://rs.tdwg.org/dwc/terms/Occurrence'); expect(terms[2].category).toBe('');
  });
});
