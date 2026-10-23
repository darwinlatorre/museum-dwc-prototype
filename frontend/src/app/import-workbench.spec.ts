import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ImportWorkbench } from './import-workbench';
import { Profile, WorkerRequest, WorkerResponse } from './analysis/model';

const profile: Profile = { id: 'p', name: 'Perfil', version: '1', status: 'PUBLISHED', revision: 1, description: '', rules: [] };
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
describe('Preservación pública del análisis local', () => {
  beforeEach(() => {
    DelayedWorker.all = [];
    vi.stubGlobal('Worker', DelayedWorker);
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

  it('conserva siguiente/atrás, valores libres, limpieza, unicidad y rechazo de respuestas canceladas', async () => {
    const f = TestBed.createComponent(ImportWorkbench);
    f.componentRef.setInput('profiles', [profile]);
    f.componentRef.setInput('terms', []);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    const click = async (name: string) => {
      const button = [...root.querySelectorAll('button')].find((b) => b.textContent?.trim() === name || b.getAttribute('aria-label') === name)!;
      expect(button, name).toBeTruthy();
      button.click();
      await f.whenStable();
    };
    const input = root.querySelector('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [new File(['a,b\n1,2'], 'original.csv')] });
    input.dispatchEvent(new Event('change'));
    await f.whenStable();
    DelayedWorker.all.at(-1)!.respond({ kind: 'parsed', data: { headers: ['a', 'b'], rows: [{ row: 2, values: ['1', '2'] }] } });
    await f.whenStable();
    (root.querySelector('input[type=checkbox]') as HTMLInputElement).click();
    await f.whenStable();
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
    await click('Revisar normalización');
    await click('Atrás');
    expect(root.querySelector<HTMLInputElement>('input[aria-label="Mapear a"]')?.value).toBe('customField');
    await click('Revisar normalización');
    await click('Confirmar opciones y continuar');
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
    (root.querySelector('.context-grid input') as HTMLInputElement).click();
    await f.whenStable();
    expect(stale.terminated).toBe(true);
    stale.respond({ kind: 'result', issues: [], changes: [] });
    await f.whenStable();
    expect(root.textContent).not.toContain('Descargar JSON');
  });
});
