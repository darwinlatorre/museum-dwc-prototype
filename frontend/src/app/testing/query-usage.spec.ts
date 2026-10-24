import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { App } from '../app';
import { Api } from '../core/api/api';
import { Catalog } from '../features/catalog/catalog';
import { Profiles } from '../features/profiles/profiles';
import type { Profile } from '../features/profiles/models/profile';

const draft: Profile = {
  id: 'draft', name: 'Original', version: '1', description: '  Texto original  ',
  status: 'DRAFT', revision: 3, rules: [],
};
const body = { name: draft.name, version: draft.version, description: draft.description, rules: [] };

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const api = {
    catalog: vi.fn().mockResolvedValue([]), profiles: vi.fn().mockResolvedValue([draft]),
    create: vi.fn().mockResolvedValue(draft), update: vi.fn().mockResolvedValue(draft),
    duplicate: vi.fn().mockResolvedValue(draft), publish: vi.fn().mockResolvedValue({ ...draft, status: 'PUBLISHED' }),
    syncCatalog: vi.fn().mockResolvedValue({ outcome: 'SUCCESS' }),
  };
  TestBed.configureTestingModule({ imports: [App, Catalog, Profiles], providers: [
    provideTanStackQuery(client), { provide: Api, useValue: api },
  ] });
  // Exercise real query/mutation field initializers without unrelated overlays or workers.
  for (const component of [App, Catalog, Profiles]) {
    TestBed.overrideComponent(component, { set: { template: '', imports: [] } });
  }
  await TestBed.compileComponents();
  return { client, api };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });

describe('Contrato de uso de TanStack Query', () => {
  it('comparte el cliente del proveedor sin construir mediante el alias deprecado', async () => {
    const { client } = await setup();
    const catalog = TestBed.createComponent(Catalog);
    const profiles = TestBed.createComponent(Profiles);
    await catalog.whenStable();
    await profiles.whenStable();
    expect(TestBed.runInInjectionContext(() => inject(QueryClient))).toBe(client);
    expect(profiles.componentInstance.client).toBe(client);
    // Structural guard on compiled constructors: an equivalent deprecated alias has
    // no behavioral difference. Runtime identity and invalidation are checked separately.
    expect(Catalog.toString()).not.toContain('injectQueryClient');
    expect(Profiles.toString()).not.toContain('injectQueryClient');
  });

  it('monta una vez el cliente compartido y lo desmonta al destruir el inyector', async () => {
    const { client } = await setup();
    const mount = vi.spyOn(client, 'mount');
    const unmount = vi.spyOn(client, 'unmount');
    expect(TestBed.inject(QueryClient)).toBe(client);
    expect(TestBed.runInInjectionContext(() => inject(QueryClient))).toBe(client);
    expect(mount).toHaveBeenCalledTimes(1);
    TestBed.resetTestingModule();
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it.each(['create', 'update', 'duplicate', 'publish'] as const)(
    '%s conserva la acción y refresca perfiles, no catálogo, en el cliente compartido', async (action) => {
      const { client, api } = await setup();
      const app = TestBed.createComponent(App);
      const profiles = TestBed.createComponent(Profiles);
      await app.whenStable();
      await profiles.whenStable();
      await vi.waitFor(() => expect(app.componentInstance.profiles.data()).toEqual([draft]));
      const instance = profiles.componentInstance;
      if (action === 'publish') {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        instance.publish(draft);
      } else {
        if (action === 'create') instance.create();
        else if (action === 'update') instance.edit(draft);
        else instance.duplicate(draft);
        instance.model.set(body);
        instance.save();
      }
      await vi.waitFor(() => expect(instance.mutation.isSuccess()).toBe(true));
      await vi.waitFor(() => expect(api.profiles).toHaveBeenCalledTimes(2));
      expect(api.catalog).toHaveBeenCalledTimes(1);
      if (action === 'create') expect(api.create).toHaveBeenCalledWith(body);
      if (action === 'update') expect(api.update).toHaveBeenCalledWith(draft, body);
      if (action === 'duplicate') expect(api.duplicate).toHaveBeenCalledWith(draft, body.name, body.version);
      if (action === 'publish') expect(api.publish).toHaveBeenCalledWith(draft);
      expect(instance.open()).toBe(false);
      expect(instance.notice()).toBe('Perfil guardado en el servidor.');
      expect(client.getQueryData(['profiles'])).toEqual([draft]);
      expect(client.getQueryData(['catalog'])).toEqual([]);
    },
  );

  it.each([
    ['SUCCESS', 'Catálogo sincronizado con TDWG.'],
    ['FAILED', 'No se pudo sincronizar. Se conserva la última versión válida.'],
    ['SUPERSEDED', 'Otra sincronización reemplazó este intento; se conserva el estado más reciente.'],
    ['transport', 'No se pudo confirmar la sincronización. Consulte el estado del catálogo antes de reintentar.'],
  ])('sincronización %s refresca catálogo incluso sin éxito y conserva perfiles', async (outcome, notice) => {
    const { client, api } = await setup();
    if (outcome === 'transport') api.syncCatalog.mockRejectedValue(new Error('Sin red'));
    else api.syncCatalog.mockResolvedValue({ outcome });
    const app = TestBed.createComponent(App);
    const catalog = TestBed.createComponent(Catalog);
    await app.whenStable();
    await catalog.whenStable();
    await vi.waitFor(() => expect(app.componentInstance.catalog.data()).toEqual([]));
    catalog.componentInstance.synchronize();
    await vi.waitFor(() => expect(catalog.componentInstance.notice()).toBe(notice));
    await vi.waitFor(() => expect(api.catalog).toHaveBeenCalledTimes(2));
    expect(api.syncCatalog).toHaveBeenCalledTimes(1);
    expect(api.profiles).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(['profiles'])).toEqual([draft]);
    expect(client.getQueryData(['catalog'])).toEqual([]);
  });
});
