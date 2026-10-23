import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { Api } from './api';
import { Catalog } from './catalog';
import { Profiles } from './profiles';
import { ImportWorkbench } from './import-workbench';
import { Profile, Term, WorkerRequest } from './analysis/model';

const terms: Term[] = [
  { name: 'catalogNumber', uri: 'https://example.org/catalogNumber', definition: 'Original definition', category: 'http://rs.tdwg.org/dwc/terms/Occurrence', status: 'recommended' },
  { name: 'otherCatalogNumbers', uri: 'https://example.org/otherCatalogNumbers', definition: 'Other numbers', category: 'http://rs.tdwg.org/dwc/terms/Occurrence', status: 'deprecated' },
  { name: 'eventDate', uri: 'https://example.org/eventDate', definition: 'Date', category: '', status: 'recommended' },
];
const profile: Profile = {
  id: 'isolated', name: 'Texto original English', version: '1', status: 'PUBLISHED', revision: 1,
  description: 'Keep user prose exactly', rules: [{ field: 'catalogNumber', kind: 'required', severity: 'ERROR', condition: 'always', message: 'Original user message', source: 'Original source' }],
};
let requests: WorkerRequest[];
class LocalWorker {
  onmessage?: (event: MessageEvent) => void;
  onerror?: () => void;
  terminate() {}
  postMessage(request: WorkerRequest) {
    requests.push(request);
    queueMicrotask(() => this.onmessage?.({ data: request.kind === 'parse'
      ? { id: request.id, kind: 'parsed', data: { headers: ['catalog', 'raw'], rows: [{ row: 2, values: ['  original  ', 'N/A'] }] } }
      : { id: request.id, kind: 'result', changes: [], issues: [
        { field: 'catalogNumber', row: 2, description: 'Original error', severity: 'ERROR', profile: profile.name, version: '1' },
        { field: 'raw', row: null, description: 'Original warning', severity: 'WARNING', profile: profile.name, version: '1' },
      ] } } as MessageEvent));
  }
}
const button = (root: ParentNode, name: string) => {
  const found = [...root.querySelectorAll('button')].find((b) => b.textContent?.trim() === name || b.getAttribute('aria-label') === name);
  expect(found, name).toBeTruthy();
  return found as HTMLButtonElement;
};
const field = (root: ParentNode, name: string) => {
  const found = [...root.querySelectorAll('label')].find((label) => {
    const copy = label.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('input,select,textarea').forEach((control) => control.remove());
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
async function click(f: ComponentFixture<unknown>, name: string, root: ParentNode = f.nativeElement) {
  button(root, name).click();
  await f.whenStable();
}
async function workbench() {
  const f = TestBed.createComponent(ImportWorkbench);
  f.componentRef.setInput('terms', terms);
  f.componentRef.setInput('profiles', [profile]);
  await f.whenStable();
  const input = f.nativeElement.querySelector('input[type=file]');
  Object.defineProperty(input, 'files', { value: [new File(['catalog,raw\n  original  ,N/A'], 'isolated.csv')] });
  input.dispatchEvent(new Event('change'));
  await f.whenStable();
  (f.nativeElement.querySelector('input[type=checkbox]') as HTMLInputElement).click();
  await f.whenStable();
  await click(f, 'Mapear columnas');
  return f;
}
async function context(f: ComponentFixture<unknown>) {
  await click(f, 'Revisar normalización');
  await click(f, 'Confirmar opciones y continuar');
}

describe('Evolución de los controles públicos', () => {
  beforeEach(() => {
    requests = [];
    vi.stubGlobal('Worker', LocalWorker);
    // jsdom has no viewport media API; PrimeNG overlays query it on opening.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
    }));
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })),
      { provide: Api, useValue: { create: vi.fn().mockRejectedValue(new Error('Fallo aislado')), update: vi.fn() } },
    ] });
  });
  afterEach(() => {
    // Destroy PrimeNG overlays before restoring the browser API stubs they use.
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('permite escoger cantidad en normalización y diagnóstico sin cambiar el resultado completo', async () => {
    const f = await workbench();
    await click(f, 'Revisar normalización');
    expect(f.nativeElement.querySelector('.p-paginator-rpp-dropdown')).toBeTruthy();
    await click(f, 'Confirmar opciones y continuar');
    await click(f, 'Validar localmente');
    await f.whenStable();
    expect(f.nativeElement.querySelector('.p-paginator-rpp-dropdown')).toBeTruthy();
    expect(f.componentInstance.issues()?.length).toBe(2);
  });

  it('combina los cuatro contextos y hace Otros exclusivo sin cambiar el contrato del worker', async () => {
    const f = await workbench();
    await context(f);
    const root = f.nativeElement as HTMLElement;
    const labels = [
      'Asociados a un permiso de recolección o acceso a recursos genéticos.',
      'Colección biológica.', 'Eventos de muestreo.', 'Marinos.',
      'Otros: observaciones en campo, registros fortuitos u otros orígenes no contemplados.',
    ];
    for (const name of labels) expect(root.textContent).toContain(name);
    for (const name of labels.slice(0, 4)) {
      field(root, name).click();
      await f.whenStable();
    }
    expect(labels.slice(0, 4).every((n) => field(root, n).checked)).toBe(true);
    field(root, labels[4]).click();
    await f.whenStable();
    expect(labels.slice(0, 4).every((n) => !field(root, n).checked)).toBe(true);
    await click(f, 'Validar localmente');
    expect(requests.at(-1)).toMatchObject({ kind: 'validate', context: { collection: false, permit: false, sampling: false, marine: false }, options: { trim: false, emptyMarkers: false } });
    expect(Object.keys((requests.at(-1) as Extract<WorkerRequest, { kind: 'validate' }>).context).sort()).toEqual(['collection', 'marine', 'permit', 'sampling']);
    expect(requests.at(-1)).toMatchObject({ data: { rows: [{ row: 2, values: ['  original  ', 'N/A'] }] } });
    await click(f, 'Revisar contexto / ejecutar de nuevo');
    expect(field(root, labels[4]).checked).toBe(true);
    field(root, labels[1]).click();
    await f.whenStable();
    expect(field(root, labels[4]).checked).toBe(false);
    expect(field(root, labels[1]).checked).toBe(true);
  });

  it('resalta el origen, sincroniza sugerencias con selector y limpiar, y conserva destinos únicos', async () => {
    const f = await workbench();
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('th[scope=row]')?.textContent).toContain('catalog');
    expect(root.querySelector('.mapping-table app-dwc-picker')).toBeTruthy();
    await click(f, 'catalogNumber');
    expect(button(root, 'catalogNumber').getAttribute('aria-pressed')).toBe('true');
    expect(button(root, 'otherCatalogNumbers').getAttribute('aria-pressed')).toBe('false');
    await click(f, 'Limpiar Mapear catalog');
    expect(button(root, 'catalogNumber').getAttribute('aria-pressed')).toBe('false');
    const picker = root.querySelector('input[aria-label="Mapear catalog"]') as HTMLInputElement;
    expect(picker).toBeTruthy();
    (picker.closest('p-select')!.querySelector('[role=button]') as HTMLElement).click();
    await f.whenStable();
    expect(document.querySelector('input[role=searchbox]')).toBeNull();
    expect(picker.closest('app-dwc-picker')!.querySelectorAll('input')).toHaveLength(1);
    await change(f, picker, 'otherCatalog');
    expect([...document.querySelectorAll('[role=option]')].map((o) => o.textContent?.trim())).toEqual(['otherCatalogNumbers']);
    const option = [...document.querySelectorAll('[role=option]')].find((o) => o.textContent?.includes('otherCatalogNumbers')) as HTMLElement;
    expect(option).toBeTruthy();
    option.click();
    await f.whenStable();
    expect(button(root, 'otherCatalogNumbers').getAttribute('aria-pressed')).toBe('true');
    await click(f, 'catalogNumber');
    const raw = root.querySelector('input[aria-label="Mapear raw"]') as HTMLInputElement;
    await change(f, raw, 'catalogNumber');
    expect(root.textContent).toContain('Cada campo de destino puede usarse una sola vez.');
    expect(button(root, 'Revisar normalización').disabled).toBe(true);
    await click(f, 'Limpiar Mapear raw');
    expect(button(root, 'Revisar normalización').disabled).toBe(false);
  });

  it('permite volver por el progreso sin perder archivo, mapeo, contexto ni diagnóstico', async () => {
    const f = await workbench();
    const root = f.nativeElement as HTMLElement;
    const step = (i: number) => root.querySelectorAll<HTMLButtonElement>('.steps button')[i];
    expect(root.querySelectorAll('.steps button')).toHaveLength(6);
    expect(step(5).disabled).toBe(true);
    await click(f, 'catalogNumber');
    await context(f);
    field(root, 'Colección biológica.').click();
    await f.whenStable();
    await click(f, 'Validar localmente');
    const count = requests.length;
    step(0).click();
    await f.whenStable();
    expect(root.querySelector('input[type=file]')).toBeTruthy();
    step(2).click();
    await f.whenStable();
    expect(button(root, 'catalogNumber').getAttribute('aria-pressed')).toBe('true');
    step(4).click();
    await f.whenStable();
    expect(field(root, 'Colección biológica.').checked).toBe(true);
    step(5).click();
    await f.whenStable();
    expect(root.textContent).toContain('Original error');
    expect(root.textContent).toContain('isolated.csv');
    expect(step(5).getAttribute('aria-current')).toBe('step');
    expect(requests).toHaveLength(count);
    step(1).click();
    await f.whenStable();
    (root.querySelector('input[type=checkbox]') as HTMLInputElement).click();
    await f.whenStable();
    expect(step(2).disabled).toBe(true);
    expect(step(4).disabled).toBe(true);
    expect(step(5).disabled).toBe(true);
  });

  it('bloquea el progreso sin archivo y con destinos repetidos', async () => {
    const empty = TestBed.createComponent(ImportWorkbench);
    empty.componentRef.setInput('terms', terms);
    empty.componentRef.setInput('profiles', [profile]);
    await empty.whenStable();
    const steps = empty.nativeElement.querySelectorAll('.steps button') as NodeListOf<HTMLButtonElement>;
    expect(steps).toHaveLength(6);
    expect([...steps].slice(1).every((b) => b.disabled)).toBe(true);
    const f = await workbench();
    const root = f.nativeElement as HTMLElement;
    await click(f, 'catalogNumber');
    await change(f, root.querySelector('input[aria-label="Mapear raw"]')!, 'catalogNumber');
    expect([...root.querySelectorAll<HTMLButtonElement>('.steps button')].slice(3).every((b) => b.disabled)).toBe(true);
  });

  it('distingue errores por texto y conserva las descargas completas al filtrar', async () => {
    const f = await workbench();
    await context(f);
    await click(f, 'Validar localmente');
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('tr.issue-error')?.textContent).toContain('Error');
    expect(root.querySelector('tr.issue-error strong')?.textContent).toBe('Original error');
    await change(f, field(root, 'Severidad'), 'WARNING');
    expect(root.textContent).not.toContain('Original error');
    expect(root.textContent).toContain('Original warning');
    let blob: Blob | undefined;
    vi.stubGlobal('URL', { createObjectURL: (value: Blob) => { blob = value; return 'blob:isolated'; }, revokeObjectURL: () => {} });
    const anchor = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await click(f, 'Descargar JSON');
    const text = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsText(blob!); });
    const report = JSON.parse(text);
    expect(report).toHaveLength(2);
    expect(report[0]).toEqual({ field: 'catalogNumber', row: 2, description: 'Original error', severity: 'ERROR', profile: profile.name, version: '1' });
    expect(report[1].severity).toBe('WARNING');
    anchor.mockRestore();
  });

  it('compone búsqueda, categoría canónica y estado, muestra categorías legibles y restablece', async () => {
    const f = TestBed.createComponent(Catalog);
    f.componentRef.setInput('terms', terms);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    const status = field(root, 'Estado');
    const category = field(root, 'Categoría');
    const option = [...category.querySelectorAll('option')].find((o) => o.textContent === 'Occurrence');
    expect(option?.value).toBe(terms[0].category);
    expect(root.textContent).toContain('Sin categoría');
    await change(f, category, terms[0].category);
    await change(f, status, 'deprecated');
    await change(f, field(root, 'Buscar en todos los atributos'), 'otherCatalog');
    expect(root.textContent).toContain('Other numbers');
    expect(root.textContent).not.toContain('Original definition');
    await change(f, field(root, 'Buscar en todos los atributos'), 'eventDate');
    expect(root.textContent).toContain('Ningún término coincide');
    await click(f, 'Restablecer filtros');
    expect(root.textContent).toContain('Original definition');
    expect(root.textContent).toContain('Other numbers');
    expect(terms[0].category).toBe('http://rs.tdwg.org/dwc/terms/Occurrence');
    expect(terms[2].category).toBe('');
  });

  it('abre un diálogo bloqueado para publicados y conserva texto y error del nuevo borrador', async () => {
    const f = TestBed.createComponent(Profiles);
    f.componentRef.setInput('profiles', [profile]);
    f.componentRef.setInput('terms', terms);
    await f.whenStable();
    await click(f, 'Ver reglas');
    let dialog = document.querySelector('[role=dialog]') as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(field(dialog, 'Nombre').disabled).toBe(true);
    expect(field(dialog, 'Mensaje de diagnóstico').value).toBe('Original user message');
    expect((dialog.querySelector('input[aria-label="Campo Darwin Core de la regla 1"]') as HTMLInputElement).disabled).toBe(true);
    expect([...dialog.querySelectorAll('button')].some((b) => b.textContent?.includes('Guardar borrador'))).toBe(false);
    await click(f, 'Cerrar editor', dialog);
    await click(f, 'Crear perfil');
    dialog = document.querySelector('[role=dialog]') as HTMLElement;
    await change(f, field(dialog, 'Nombre'), 'User text inglés');
    await change(f, field(dialog, 'Versión'), '1');
    await change(f, field(dialog, 'Descripción'), '  Keep original prose  ');
    await click(f, 'Guardar borrador', dialog);
    await vi.waitFor(() => expect(dialog.textContent).toContain('Fallo aislado'));
    expect(field(dialog, 'Descripción').value).toBe('  Keep original prose  ');
    expect(TestBed.inject(Api).create).toHaveBeenCalledWith({ name: 'User text inglés', version: '1', description: '  Keep original prose  ', rules: [] });
    expect(profile.description).toBe('Keep user prose exactly');
  });
});
