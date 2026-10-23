import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { Profiles } from './profiles';
import { Api } from './api';
import { Profile } from './analysis/model';

it('preserva el selector de borradores vía FormField y bloquea publicados', async () => {
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  const update = vi.fn().mockRejectedValue(new Error('Rechazo aislado'));
  TestBed.configureTestingModule({ providers: [
    provideTanStackQuery(new QueryClient({ defaultOptions: { mutations: { retry: false } } })),
    { provide: Api, useValue: { update } },
  ] });
  const draft: Profile = { id: 'd', name: 'Original', version: '1', status: 'DRAFT', revision: 3, description: '  Original prose  ', rules: [
    { field: 'customField', kind: 'required', condition: 'always', severity: 'ERROR', message: 'Original message', source: 'Original source' },
  ] };
  const before = JSON.stringify(draft);
  const f = TestBed.createComponent(Profiles);
  f.componentRef.setInput('profiles', [draft, { ...draft, id: 'p', status: 'PUBLISHED' }]);
  f.componentRef.setInput('terms', [{ name: 'eventDate', uri: '', definition: '', category: '', status: 'recommended' }]);
  const click = async (name: string, scope: ParentNode = f.nativeElement) => {
    const b = [...scope.querySelectorAll('button')].find(b => b.textContent?.trim() === name || b.getAttribute('aria-label') === name)!;
    expect(b, name).toBeTruthy(); b.click(); await f.whenStable();
  };
  try {
    await f.whenStable();
    await click('Editar borrador');
    let dialog = document.querySelector('[role=dialog]')!;
    let input = dialog.querySelector<HTMLInputElement>('app-dwc-picker input')!;
    expect(input.value).toBe('customField');
    expect(input.disabled).toBe(false);
    await click('Limpiar Campo Darwin Core de la regla 1', dialog);
    expect(input.value).toBe('');
    expect([...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Guardar borrador')!.disabled).toBe(true);
    input.value = '  freeValue  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await f.whenStable();
    await click('Guardar borrador', dialog);
    await vi.waitFor(() => expect(dialog.textContent).toContain('Rechazo aislado'));
    expect(update).toHaveBeenCalledWith(draft, { name: 'Original', version: '1', description: '  Original prose  ', rules: [{ ...draft.rules[0], field: '  freeValue  ' }] });
    expect(input.value).toBe('  freeValue  ');
    await click('Cerrar editor', dialog);
    await click('Ver reglas');
    dialog = document.querySelector('[role=dialog]')!;
    input = dialog.querySelector<HTMLInputElement>('app-dwc-picker input')!;
    expect(input.value).toBe('customField');
    expect(input.disabled).toBe(true);
    const clear = [...dialog.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Limpiar Campo Darwin Core de la regla 1')!;
    expect(clear.disabled).toBe(true); clear.click(); await f.whenStable();
    expect(input.value).toBe('customField');
    expect(update).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(draft)).toBe(before);
  } finally { TestBed.resetTestingModule(); vi.unstubAllGlobals(); }
});
