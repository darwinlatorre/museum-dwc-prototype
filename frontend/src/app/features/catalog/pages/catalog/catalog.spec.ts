import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { afterEach, vi } from 'vitest';
import { Catalog } from './catalog';
import { BASE_URL } from '../../../../core/api/api';

const term = { name: 'eventDate', uri: 'http://rs.tdwg.org/dwc/terms/eventDate', definition: 'Official text', category: '', status: 'current' };
const status = { active: { revision: 'a'.repeat(40), hash: 'hash', snapshotVersion: 1, activatedAt: '2026-01-01T00:00:00Z', termCount: 1, added: 0, modified: 0, deprecated: 0, sourceHashes: {} }, attempts: 1, lastAttempt: '2026-01-01T00:00:00Z', lastFailure: null };

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(['catalog'], [term]);
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  TestBed.configureTestingModule({ providers: [provideTanStackQuery(client), provideHttpClient(),
    provideHttpClientTesting(), { provide: BASE_URL, useValue: 'http://localhost:8080/api' }] });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(Catalog);
  fixture.componentRef.setInput('terms', [term]);
  const button = () => [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')]
    .find(b => b.textContent?.trim() === 'Sincronizar con TDWG')!;
  return { fixture, client, invalidate, button, http };
}

afterEach(() => {
  try { TestBed.inject(HttpTestingController).verify(); } finally { TestBed.resetTestingModule(); vi.restoreAllMocks(); }
});

describe('Sincronización manual del catálogo', () => {
  it('resizes a whole column without sorting, changing terms or sending requests', async () => {
    const { fixture, http, client } = setup();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector<HTMLButtonElement>('[aria-label="Ancho de Término / enlace oficial"]');
    expect(trigger).not.toBeNull();
    trigger!.click();
    await fixture.whenStable();
    const input = root.querySelector<HTMLInputElement>('.museum-column-width input')!;
    input.value = '360';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    root.querySelector<HTMLButtonElement>('.museum-column-width .museum-width-apply')!.click();
    await fixture.whenStable();
    expect(root.querySelector<HTMLTableColElement>('col')?.style.width).toBe('360px');
    expect(fixture.componentInstance.order()).toBeNull();
    expect(client.getQueryData(['catalog'])).toEqual([term]);
    expect(root.querySelector('a')?.textContent).toBe(term.uri);
    const search = root.querySelector<HTMLInputElement>('input[type=search]')!;
    search.value = 'no match'; search.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector<HTMLTableColElement>('col')?.style.width).toBe('360px');
    search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[aria-label="Ordenar por Término / enlace oficial"]')!.click();
    await fixture.whenStable();
    expect(root.querySelector<HTMLTableColElement>('col')?.style.width).toBe('360px');
    expect(root.querySelector('a')?.textContent).toBe(term.uri);
    http.expectNone(() => true);
  });
  it('distingue vocabulario de configuración global sin conservar perfiles retirados', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toMatch(/\bperfiles?\b/i);
    expect(fixture.nativeElement.textContent).toContain('La configuración global define los requisitos.');
    expect(fixture.nativeElement.querySelector('[role=status]').textContent)
      .toContain('Actualizar no modifica la configuración de validación ni los archivos.');
  });

  it('ofrece búsqueda y enlaces oficiales con lenguaje claro sin alterar las citas', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input[type=search]')?.closest('label')?.textContent).toContain('Buscar en todos los atributos');
    expect(root.querySelector('input[type=search]')?.getAttribute('placeholder')).toBe('Nombre, definición, enlace, categoría o estado');
    expect(root.querySelector('th [aria-label="Ordenar por Término / enlace oficial"]')?.textContent).toBe('Término / enlace oficial');
    expect(root.querySelector('a')?.getAttribute('href')).toBe(term.uri);
    expect(root.querySelector('a')?.textContent).toBe(term.uri);
    expect(root.querySelector('[lang=en]')?.textContent).toBe(term.definition);
  });

  it('envía un POST sin cuerpo, impide doble clic y refresca la caché tras confirmar éxito', async () => {
    const { fixture, invalidate, button, http } = setup();
    await fixture.whenStable();
    const trigger = button();
    expect(trigger).toBeTruthy();
    expect(trigger.closest('.catalog-actions')).toBeTruthy();
    const feedback = fixture.nativeElement.querySelector('[role=status]');
    expect(feedback).toBeTruthy();
    trigger.click();
    await vi.waitFor(() => expect(trigger.disabled).toBe(true));
    trigger.click();
    const request = http.expectOne({ url: 'http://localhost:8080/api/catalog/sync', method: 'POST' });
    expect(request.request.body).toBeNull();
    expect(request.request.detectContentTypeHeader()).toBeNull();
    http.expectNone('http://localhost:8080/api/catalog/sync');
    expect(fixture.nativeElement.textContent).toContain('Sincronizando');
    expect(trigger.querySelector('.sync-indicator.is-spinning')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBe(feedback);
    expect(feedback.textContent).toContain('Puede seguir consultando');
    request.flush({ outcome: 'SUCCESS', status });
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
    const { fixture, client, button, http } = setup();
    await fixture.whenStable();
    expect(button()).toBeTruthy();
    const trigger = button(); trigger.click();
    await vi.waitFor(() => expect(trigger.disabled).toBe(true));
    http.expectOne({ url: 'http://localhost:8080/api/catalog/sync', method: 'POST' }).flush({ outcome, status });
    await vi.waitFor(() => expect(fixture.nativeElement.textContent).toContain(text));
    expect(fixture.nativeElement.textContent).not.toContain('Catálogo sincronizado con TDWG.');
    expect(client.getQueryData(['catalog'])).toEqual([term]);
  });

  it('informa falta de confirmación ante fallo de transporte y conserva los términos', async () => {
    const { fixture, client, button, http } = setup();
    await fixture.whenStable();
    expect(button()).toBeTruthy();
    const trigger = button(); trigger.click();
    await vi.waitFor(() => expect(trigger.disabled).toBe(true));
    http.expectOne({ url: 'http://localhost:8080/api/catalog/sync', method: 'POST' }).error(new ProgressEvent('error'));
    await vi.waitFor(() => expect(fixture.nativeElement.textContent).toContain('No se pudo confirmar la sincronización.'));
    expect(client.getQueryData(['catalog'])).toEqual([term]);
    expect(fixture.nativeElement.textContent).not.toContain('Catálogo sincronizado con TDWG.');
  });
});
