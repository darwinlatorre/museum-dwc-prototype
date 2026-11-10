import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { MuseumLayout } from '../layouts/museum-layout/museum-layout';
import { provideRouter } from '@angular/router';
import { CatalogMetadata } from '../features/catalog/services/catalog-metadata';
import { RecordSourcesMetadata } from '../features/record-sources/services/record-sources-metadata';
import { Catalog } from '../features/catalog/pages/catalog/catalog';
import { ValidationConfigurationEditor } from '../features/record-sources/pages/validation-configuration/validation-configuration';
import { configurationFixture } from './validation-fixture';

async function setup() {
  const configuration = configurationFixture(['eventDate']);
  const saved = { revision: 8, contexts: configuration.contexts.map(item =>
    item.context === 'collection' ? { ...item, requiredFields: ['eventDate', 'custom'] } : item) };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const api = {
    catalog: vi.fn().mockResolvedValue([]), validationConfiguration: vi.fn().mockResolvedValue(configuration),
    updateValidationConfiguration: vi.fn().mockResolvedValue(saved), syncCatalog: vi.fn().mockResolvedValue({ outcome: 'SUCCESS' }),
  };
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideTanStackQuery(client),
    { provide: CatalogMetadata, useValue: api }, { provide: RecordSourcesMetadata, useValue: api }] });
  for (const component of [MuseumLayout, Catalog, ValidationConfigurationEditor]) {
    TestBed.overrideComponent(component, { set: { template: '', imports: [] } });
  }
  await TestBed.compileComponents();
  const editor = () => {
    const f = TestBed.createComponent(ValidationConfigurationEditor);
    f.componentRef.setInput('configuration', configuration); f.componentRef.setInput('terms', []);
    return f;
  };
  return { client, api, configuration, saved, editor };
}
afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });

describe('Contrato de uso de TanStack Query', () => {
  it('comparte el cliente raíz sin el alias deprecado', async () => {
    const { client, editor } = await setup();
    const f = editor(); await f.whenStable();
    expect(TestBed.runInInjectionContext(() => inject(QueryClient))).toBe(client);
    expect(f.componentInstance.client).toBe(client);
    expect(Catalog.toString()).not.toContain('injectQueryClient');
    expect(ValidationConfigurationEditor.toString()).not.toContain('injectQueryClient');
  });
  it('monta una vez y desmonta el cliente con el inyector', async () => {
    const { client } = await setup();
    const mount = vi.spyOn(client, 'mount'); const unmount = vi.spyOn(client, 'unmount');
    expect(TestBed.inject(QueryClient)).toBe(client);
    expect(TestBed.runInInjectionContext(() => inject(QueryClient))).toBe(client);
    expect(mount).toHaveBeenCalledTimes(1); TestBed.resetTestingModule(); expect(unmount).toHaveBeenCalledTimes(1);
  });
  it('guardar actualiza e invalida solo configuración y pasa AbortSignal a las consultas', async () => {
    const { client, api, saved, editor } = await setup();
    const app = TestBed.createComponent(MuseumLayout); const f = editor();
    await app.whenStable(); await f.whenStable();
    await vi.waitFor(() => expect(api.validationConfiguration).toHaveBeenCalledTimes(1));
    expect(api.validationConfiguration.mock.calls[0]).toEqual([expect.any(AbortSignal)]);
    expect(api.catalog.mock.calls[0]).toEqual([expect.any(AbortSignal)]);
    api.validationConfiguration.mockResolvedValue(saved);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    f.componentInstance.field.set('custom'); f.componentInstance.add(); f.componentInstance.save();
    await vi.waitFor(() => expect(f.componentInstance.mutation.isSuccess()).toBe(true));
    expect(api.updateValidationConfiguration).toHaveBeenCalledWith({ ...saved, revision: 7 });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['validation-configuration'] });
    expect(client.getQueryData(['validation-configuration'])).toEqual(saved);
    expect(client.getQueryData(['catalog'])).toEqual([]); expect(api.catalog).toHaveBeenCalledTimes(1);
  });
  it('un fallo de consulta muestra error real sin configuración sintética y permite reintentar', async () => {
    const { api } = await setup(); api.validationConfiguration.mockRejectedValueOnce(new Error('Sin configuración'));
    const app = TestBed.createComponent(MuseumLayout); await app.whenStable();
    await vi.waitFor(() => expect(app.componentInstance.configuration.isError()).toBe(true));
    expect(app.componentInstance.configuration.data()).toBeUndefined();
    expect(app.componentInstance.configuration.error()?.message).toBe('Sin configuración');
    app.componentInstance.retry();
    await vi.waitFor(() => expect(app.componentInstance.configuration.isSuccess()).toBe(true));
  });
  it.each([
    ['SUCCESS', 'Catálogo sincronizado con TDWG.'],
    ['FAILED', 'No se pudo sincronizar. Se conserva la última versión válida.'],
    ['SUPERSEDED', 'Otra sincronización reemplazó este intento; se conserva el estado más reciente.'],
    ['transport', 'No se pudo confirmar la sincronización. Consulte el estado del catálogo antes de reintentar.'],
  ])('sincronización %s refresca catálogo incluso sin éxito y conserva configuración', async (outcome, notice) => {
    const { client, api, configuration } = await setup();
    if (outcome === 'transport') api.syncCatalog.mockRejectedValue(new Error('Sin red'));
    else api.syncCatalog.mockResolvedValue({ outcome });
    const app = TestBed.createComponent(MuseumLayout); const catalog = TestBed.createComponent(Catalog);
    await app.whenStable(); await catalog.whenStable();
    await vi.waitFor(() => expect(app.componentInstance.catalog.data()).toEqual([]));
    catalog.componentInstance.synchronize();
    await vi.waitFor(() => expect(catalog.componentInstance.notice()).toBe(notice));
    await vi.waitFor(() => expect(api.catalog).toHaveBeenCalledTimes(2));
    expect(api.syncCatalog).toHaveBeenCalledTimes(1); expect(api.validationConfiguration).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(['validation-configuration'])).toEqual(configuration);
  });
});
