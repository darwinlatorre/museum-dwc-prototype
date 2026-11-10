import { Component } from '@angular/core';
import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { routes } from '../../app.routes';
import { CatalogMetadata } from '../../features/catalog/services/catalog-metadata';
import { RecordSourcesMetadata } from '../../features/record-sources/services/record-sources-metadata';
import { configurationFixture } from '../../testing/validation-fixture';

@Component({ template: '', styleUrl: '../../../styles.scss' })
class MappingStyleContract {}

describe('Collection workspace', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['catalog'], []);
    client.setQueryData(['validation-configuration'], configurationFixture([]));
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [provideRouter(routes), provideTanStackQuery(client),
        { provide: CatalogMetadata, useValue: { catalog: async () => [] } },
        { provide: RecordSourcesMetadata, useValue: { validationConfiguration: async () => configurationFixture([]) } }],
    });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('reserva un marco de trabajo estable y controles de mapeo con un tamaño común', async () => {
    await RouterTestingHarness.create('/analisis');
    const styleFixture = TestBed.createComponent(MappingStyleContract); await styleFixture.whenStable();
    const shell = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(shell).toContain('min-height: 100dvh');
    expect(shell).not.toMatch(/(?<!min-)height:\s*100dvh/);
    expect(shell).toMatch(/main[^{}]*\{[^}]*min-height:\s*0/s);
    expect(shell).toMatch(/main[^{}]*\{[^}]*overflow-x:\s*clip/s);
    expect(shell).toMatch(/main[^{}]*\{[^}]*width:/s);
    expect(shell).toContain('--mapping-control-height:');
    expect(shell).toMatch(/\.mapping-table[^{}]*\.suggestion-chips[^{}]*button[^{}]*\{[^}]*min-height:\s*2\.25rem/s);
    expect(shell).toMatch(/\.dwc-picker[^{}]*\.p-select-label[^{}]*\{[^}]*border: 0 !important/s);
    expect(shell).toMatch(/\.mapping-table[^{}]*app-dwc-picker[^{}]*\.dwc-picker[^{}]*\{[^}]*display: flex/s);
  });

  it('muestra carga, error real y reintenta metadatos sin respaldo sintético', async () => {
    const client = TestBed.inject(QueryClient);
    client.removeQueries();
    let resolve!: (terms: never[]) => void;
    vi.spyOn(TestBed.inject(CatalogMetadata), 'catalog').mockReturnValue(new Promise<never[]>(done => { resolve = done; }));
    const configuration = vi.spyOn(TestBed.inject(RecordSourcesMetadata), 'validationConfiguration')
      .mockRejectedValueOnce(new Error('Sin configuración')).mockResolvedValue(configurationFixture([]));
    const harness = await RouterTestingHarness.create('/catalogo');
    const root = harness.routeNativeElement!;
    expect(root.querySelector('[role=status]')?.textContent).toContain('Cargando catálogo');
    await vi.waitFor(() => expect(client.getQueryState(['validation-configuration'])?.status).toBe('error'));
    await harness.fixture.whenStable();
    expect(root.querySelector('[role=alert]')?.textContent).toContain('Sin configuración');
    expect(root.textContent).toContain('No hay configuración de respaldo local.');
    expect(root.querySelector('app-catalog')).toBeNull();
    resolve([]);
    await vi.waitFor(() => expect(client.getQueryState(['catalog'])?.status).toBe('success'));
    await harness.fixture.whenStable();
    [...root.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Reintentar conexión')!.click();
    await vi.waitFor(() => expect(configuration).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(client.getQueryState(['validation-configuration'])?.status).toBe('success'));
    await harness.fixture.whenStable();
    expect(root.querySelector('[role=alert]')).toBeNull();
    expect(root.querySelector('app-catalog')).toBeTruthy();
  });

  it('shows accessible navigation and local import guidance', async () => {
    const harness = await RouterTestingHarness.create('/analisis');
    const blocks = await harness.fixture.getDeferBlocks();
    expect(blocks.length).toBeGreaterThan(0);
    await blocks[0].render(DeferBlockState.Complete); await harness.fixture.whenStable();
    const root = harness.routeNativeElement!;
    expect(root.querySelector('h1')?.textContent).toContain('Calidad de los datos de colecciones');
    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Navegación principal');
    expect(root.querySelectorAll('nav a')[1].textContent).toContain('Fuentes de registros biológicos');
    expect(root.textContent).toContain('El archivo permanece en este dispositivo');
    expect(root.querySelector('input[type=file]')?.getAttribute('accept')).toBe('.csv,.xlsx');
    const mounted = root.querySelector('app-import');
    (root.querySelectorAll('nav a')[1] as HTMLAnchorElement).click(); await harness.fixture.whenStable();
    expect(root.querySelector('app-import')).toBe(mounted);
    expect(mounted?.parentElement?.hidden).toBe(true);
    (root.querySelectorAll('nav a')[0] as HTMLAnchorElement).click(); await harness.fixture.whenStable();
    expect(root.querySelector('app-import')).toBe(mounted);
    expect(mounted?.parentElement?.hidden).toBe(false);
  });
});
