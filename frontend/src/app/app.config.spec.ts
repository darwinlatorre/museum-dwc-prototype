import { FetchBackend, HttpBackend } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { appConfig } from './app.config';
import { CatalogMetadata } from './features/catalog/services/catalog-metadata';
import { CollectionsApi } from './features/collections/data-access/collections-api';
import { RecordSourcesMetadata } from './features/record-sources/services/record-sources-metadata';
import { MuseumLayout } from './layouts/museum-layout/museum-layout';
import { configurationFixture } from './testing/validation-fixture';

const status = (snapshotVersion: number) => ({ active: { snapshotVersion } });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Transporte HTTP de la aplicación', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('envía las solicitudes con fetch mediante HttpClient', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(HttpBackend)).toBeInstanceOf(FetchBackend);
  });
});

describe('Solicitudes con la configuración de producción', () => {
  let http: HttpTestingController;
  let client: QueryClient;
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideRouter([]), provideHttpClientTesting()] });
    TestBed.overrideComponent(MuseumLayout, { set: { template: '', imports: [] } });
    await TestBed.compileComponents();
    client = TestBed.inject(QueryClient); client.clear();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    try { http.verify(); } finally { client.clear(); TestBed.resetTestingModule(); vi.useRealTimers(); }
  });

  it.each(['configuration', 'catalog', 'collections'] as const)('un fallo de %s no provoca un segundo intento', async flow => {
    vi.useFakeTimers();
    const call: (signal: AbortSignal) => Promise<unknown> = flow === 'configuration'
      ? (signal: AbortSignal) => TestBed.inject(RecordSourcesMetadata).validationConfiguration(signal)
      : flow === 'catalog' ? (signal: AbortSignal) => TestBed.inject(CatalogMetadata).catalog(signal)
        : (signal: AbortSignal) => TestBed.inject(CollectionsApi).list(0, 50, signal);
    const url = flow === 'configuration' ? '/api/validation-configuration' : flow === 'catalog'
      ? '/api/catalog' : '/api/collections?page=0&size=50';
    const key = [flow];
    client.setQueryData(key, { previous: true });
    const pending = client.fetchQuery({ queryKey: key, queryFn: ({ signal }) => call(signal) }).catch(error => error);
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    await vi.advanceTimersByTimeAsync(3000);
    // Match before asserting so a failing RED leaves no outstanding request.
    const retries = http.match(url);
    retries.forEach(request => request.flush({}, { status: 503, statusText: 'Unavailable' }));
    await pending;
    expect(retries).toHaveLength(0);
    expect(client.getQueryState(key)?.status).toBe('error');
    expect(client.getQueryData(key)).toEqual({ previous: true });
  });

  it('comparte consultas concurrentes, cancela la petición y permite una nueva lectura explícita', async () => {
    const api = TestBed.inject(RecordSourcesMetadata);
    const options = { queryKey: ['validation-configuration'], queryFn: ({ signal }: { signal: AbortSignal }) => api.validationConfiguration(signal) };
    const first = client.fetchQuery(options).catch(error => error);
    const second = client.fetchQuery(options).catch(error => error);
    const request = http.expectOne('/api/validation-configuration');
    await client.cancelQueries({ queryKey: options.queryKey });
    await Promise.all([first, second]);
    expect(request.cancelled).toBe(true);
    expect(client.getQueryData(options.queryKey)).toBeUndefined();
    const retry = client.fetchQuery(options);
    const config = configurationFixture([]);
    http.expectOne('/api/validation-configuration').flush(config);
    expect(await retry).toEqual(config);
  });

  it('no reenvía una escritura fallida', async () => {
    vi.useFakeTimers();
    const api = TestBed.inject(RecordSourcesMetadata);
    const config = configurationFixture([]);
    const mutation = client.getMutationCache().build(client, { mutationFn: () => api.updateValidationConfiguration(config) });
    const pending = mutation.execute(undefined).catch(error => error);
    await vi.advanceTimersByTimeAsync(0);
    const request = http.expectOne('/api/validation-configuration');
    expect(request.request.method).toBe('PUT'); expect(request.request.body).toEqual(config);
    request.flush({}, { status: 500, statusText: 'Error' });
    await vi.advanceTimersByTimeAsync(3000); await pending;
    http.expectNone('/api/validation-configuration');
    expect(mutation.state.status).toBe('error');
  });

  it('obtiene una sola lista versionada para dos shells y conserva la última válida si cambia durante la lectura', async () => {
    const first = TestBed.createComponent(MuseumLayout);
    const second = TestBed.createComponent(MuseumLayout);
    await first.whenStable(); await second.whenStable();
    http.expectOne('/api/validation-configuration').flush(configurationFixture([]));
    http.expectOne('/api/catalog/status').flush(status(1));
    await tick();
    const reads = http.match('/api/catalog');
    reads.forEach(request => request.flush([]));
    await tick();
    http.expectOne('/api/catalog/status').flush(status(1));
    await vi.waitFor(() => expect(first.componentInstance.catalogSnapshot.isSuccess()).toBe(true));
    expect(reads).toHaveLength(1);
    expect(second.componentInstance.metadata.snapshot()).toEqual({ terms: [], snapshotVersion: 1 });
    expect(client.getQueryData(['catalog'])).toEqual([]);

    // Prefix invalidation after synchronization must refresh both public keys coherently.
    const refresh = client.invalidateQueries({ queryKey: ['catalog'] });
    await tick();
    http.expectOne('/api/catalog/status').flush(status(2)); await tick();
    http.expectOne('/api/catalog').flush([{ name: 'new' }]); await tick();
    http.expectOne('/api/catalog/status').flush(status(3));
    await refresh;
    await vi.waitFor(() => expect(first.componentInstance.catalogSnapshot.isError()).toBe(true));
    expect(first.componentInstance.metadata.snapshot()).toEqual({ terms: [], snapshotVersion: 1 });
    expect(client.getQueryData(['catalog'])).toEqual([]);
    expect(first.componentInstance.metadata.available()).toBe(false);
    first.componentInstance.retry(); await tick();
    http.expectOne('/api/validation-configuration').flush(configurationFixture([]));
    http.expectOne('/api/catalog/status').flush(status(3)); await tick();
    http.expectOne('/api/catalog').flush([]); await tick();
    http.expectOne('/api/catalog/status').flush(status(3));
    await vi.waitFor(() => expect(first.componentInstance.metadata.available()).toBe(true));
  });
});
