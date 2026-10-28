import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { Catalog } from '../features/catalog/catalog';
import { Api } from '../core/api/api';
import { label, spanish } from '../core/i18n/localization';
import { configurationFixture } from './validation-fixture';

afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

describe('Presentación española y contratos oficiales', () => {
  it('conserva citas, URI e identificadores oficiales y localiza solamente presentación', async () => {
    TestBed.configureTestingModule({ providers: [provideTanStackQuery(new QueryClient())] });
    const fixture = TestBed.createComponent(Catalog);
    const term = { name: 'scientificName', uri: 'http://rs.tdwg.org/dwc/terms/scientificName',
      definition: 'The full scientific name.', category: 'Taxon', status: 'recommended' as const };
    const before = structuredClone(term);
    fixture.componentRef.setInput('terms', [term]); await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('inglés');
    expect(root.querySelector('[lang=en]')?.textContent).toBe(term.definition);
    expect(root.textContent).toContain('scientificName'); expect(term).toEqual(before);
    expect(spanish.aria.nextPageLabel).toBe('Página siguiente'); expect(spanish.accept).toBe('Aceptar');
    expect(label('collection')).toBe('Colección biológica');
  });
});

describe('API de metadatos globales', () => {
  it('consulta con cancelación y envía solo revisión y cinco contextos sin alterar campos libres', async () => {
    const body = configurationFixture(['  freeField  ']);
    const before = JSON.stringify(body);
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal('fetch', fetch);
    const api = new Api(); const controller = new AbortController();
    await api.validationConfiguration(controller.signal);
    expect(fetch).toHaveBeenLastCalledWith('/api/validation-configuration', {
      method: 'GET', signal: controller.signal, headers: undefined, body: undefined,
    });
    await api.updateValidationConfiguration(body);
    expect(fetch).toHaveBeenLastCalledWith('/api/validation-configuration', {
      method: 'PUT', signal: undefined, headers: { 'Content-Type': 'application/json' }, body: before,
    });
    expect(JSON.stringify(body)).toBe(before);
    expect(Object.keys(JSON.parse(fetch.mock.lastCall![1].body))).toEqual(['revision', 'contexts']);
  });
  it.each([400, 409])('expone el error real %s sin simular éxito', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status, text: async () => 'Revisión o campos inválidos' }));
    await expect(new Api().updateValidationConfiguration(configurationFixture())).rejects.toThrow(
      `API ${status}: Revisión o campos inválidos. No se guardaron los cambios. Actualice los datos antes de volver a intentarlo.`,
    );
  });
  it('conserva GET catálogo y POST sincronización sin cuerpo', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }); vi.stubGlobal('fetch', fetch);
    const api = new Api(); const signal = new AbortController().signal;
    await api.catalog(signal);
    expect(fetch).toHaveBeenLastCalledWith('/api/catalog', { method: 'GET', signal, headers: undefined, body: undefined });
    await api.syncCatalog();
    expect(fetch).toHaveBeenLastCalledWith('/api/catalog/sync', { method: 'POST', signal: undefined, headers: undefined, body: undefined });
  });
});
