import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { afterEach, vi } from 'vitest';
import { Catalog } from './catalog';

const term = { name: 'eventDate', uri: 'http://rs.tdwg.org/dwc/terms/eventDate', definition: 'Official text', category: '', status: 'current' };
const status = { active: { revision: 'a'.repeat(40), hash: 'hash', snapshotVersion: 1, activatedAt: '2026-01-01T00:00:00Z', termCount: 1, added: 0, modified: 0, deprecated: 0, sourceHashes: {} }, attempts: 1, lastAttempt: '2026-01-01T00:00:00Z', lastFailure: null };

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(['catalog'], [term]);
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  TestBed.configureTestingModule({ providers: [provideTanStackQuery(client)] });
  const fixture = TestBed.createComponent(Catalog);
  fixture.componentRef.setInput('terms', [term]);
  const button = () => [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')]
    .find(b => b.textContent?.trim() === 'Sincronizar con TDWG')!;
  return { fixture, client, invalidate, button };
}

afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

describe('Sincronización manual del catálogo', () => {
  it('envía un POST sin cuerpo, impide doble clic y refresca la caché tras confirmar éxito', async () => {
    let finish!: () => void;
    const request = vi.fn().mockImplementation(() => new Promise<Response>(resolve => {
      finish = () => resolve(new Response(JSON.stringify({ outcome: 'SUCCESS', status })));
    }));
    vi.stubGlobal('fetch', request);
    const { fixture, invalidate, button } = setup();
    await fixture.whenStable();
    const trigger = button();
    expect(trigger).toBeTruthy();
    trigger.click();
    await vi.waitFor(() => expect(trigger.disabled).toBe(true));
    trigger.click();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('/api/catalog/sync', expect.objectContaining({ method: 'POST', body: undefined }));
    expect(fixture.nativeElement.textContent).toContain('Sincronizando');
    finish();
    await vi.waitFor(() => expect(fixture.nativeElement.textContent).toContain('Catálogo sincronizado con TDWG.'));
    await fixture.whenStable();
    expect(trigger.disabled).toBe(false);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['catalog'] });
    expect(fixture.nativeElement.querySelector('[role=status]').textContent).toContain('Catálogo sincronizado con TDWG.');
  });

  it.each([
    ['FAILED', 'No se pudo sincronizar. Se conserva la última versión válida.'],
    ['SUPERSEDED', 'Otra sincronización reemplazó este intento; se conserva el estado más reciente.'],
  ])('no confunde HTTP200 con éxito cuando el resultado es %s', async (outcome, text) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ outcome, status }))));
    const { fixture, client, button } = setup();
    await fixture.whenStable();
    expect(button()).toBeTruthy();
    button().click();
    await vi.waitFor(() => expect(fixture.nativeElement.textContent).toContain(text));
    expect(fixture.nativeElement.textContent).not.toContain('Catálogo sincronizado con TDWG.');
    expect(client.getQueryData(['catalog'])).toEqual([term]);
  });

  it('informa falta de confirmación ante fallo de transporte y conserva los términos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Sin red')));
    const { fixture, client, button } = setup();
    await fixture.whenStable();
    expect(button()).toBeTruthy();
    button().click();
    await vi.waitFor(() => expect(fixture.nativeElement.textContent).toContain('No se pudo confirmar la sincronización.'));
    expect(client.getQueryData(['catalog'])).toEqual([term]);
    expect(fixture.nativeElement.textContent).not.toContain('Catálogo sincronizado con TDWG.');
  });
});
