import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { routes } from './app.routes';
import { CatalogMetadata } from './features/catalog/services/catalog-metadata';
import { RecordSourcesMetadata } from './features/record-sources/services/record-sources-metadata';
import { configurationFixture } from './testing/validation-fixture';

const id = '11111111-1111-4111-8111-111111111111';
const info = { id, name: 'Colección sintética', context: 'other', revision: 1, activeCount: 0, trashCount: 0 };
describe('Rutas productivas de colecciones', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['catalog'], []); client.setQueryData(['validation-configuration'], configurationFixture([]));
    client.setQueryData(['catalog', 'snapshot'], { terms: [], snapshotVersion: 5 });
    TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes), provideTanStackQuery(client),
        { provide: CatalogMetadata, useValue: { catalog: async () => [], snapshot: async () => ({ terms: [], snapshotVersion: 5 }) } },
        { provide: RecordSourcesMetadata, useValue: { validationConfiguration: async () => configurationFixture([]) } }] });
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); TestBed.resetTestingModule(); vi.unstubAllGlobals(); });
  it('abre listado y enlace de recibo /collections/:id con navegación y títulos españoles', async () => {
    const harness = await RouterTestingHarness.create('/collections'), http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/collections?page=0&size=25').flush({ items: [info], page: 0, size: 25, totalElements: 1 });
    await vi.waitFor(() => expect(harness.routeNativeElement?.querySelector('.collection-link')).toBeTruthy());
    expect(harness.routeNativeElement?.querySelector('nav a[aria-current=page]')?.textContent).toContain('Colecciones');
    expect(document.title).toBe('Colecciones · Museo');
    (harness.routeNativeElement!.querySelector('.collection-link') as HTMLAnchorElement).click();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe(`/collections/${id}`));
    http.expectOne(`/api/collections/${id}`).flush(info);
    await harness.fixture.whenStable();
    http.expectOne(`/api/collections/${id}/records?page=0&size=25&trash=ACTIVE`).flush({ items: [], page: 0, size: 25, totalElements: 0 });
    await vi.waitFor(() => expect(harness.routeNativeElement?.textContent).toContain('Colección sintética'));
    expect(document.title).toBe('Detalle de colección · Museo');
  });
  it('conserva workbench montado y el paso local al ir a Colecciones y volver', async () => {
    const harness = await RouterTestingHarness.create('/analisis');
    const blocks = await harness.fixture.getDeferBlocks(); await blocks[0].render(DeferBlockState.Complete); await harness.fixture.whenStable();
    const workbench = harness.routeNativeElement!.querySelector('app-import');
    const fileInput = workbench!.querySelector('input[type=file]');
    await harness.navigateByUrl('/collections');
    TestBed.inject(HttpTestingController).expectOne('/api/collections?page=0&size=25').flush({ items: [], page: 0, size: 25, totalElements: 0 });
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement!.querySelector('app-import')).toBe(workbench);
    expect(workbench?.parentElement?.hidden).toBe(true);
    await harness.navigateByUrl('/analisis'); await harness.fixture.whenStable();
    expect(harness.routeNativeElement!.querySelector('app-import')).toBe(workbench);
    expect(workbench?.querySelector('input[type=file]')).toBe(fileInput);
    expect(workbench?.parentElement?.hidden).toBe(false);
  });
});
