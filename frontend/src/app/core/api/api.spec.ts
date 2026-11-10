import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { Api, BASE_URL } from './api';
import { configurationFixture } from '../../testing/validation-fixture';

describe('HTTP de metadatos', () => {
  let api: Api;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: BASE_URL, useValue: 'https://api.example.test/api/' }] });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('No fetch permitido')));
    api = TestBed.inject(Api); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    try { http.verify(); } finally { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }
  });

  it('preserva los cuatro contratos y envía solamente metadatos', async () => {
    const config = configurationFixture(['eventDate']);
    const calls = [
      { promise: api.catalog(), path: 'catalog', method: 'GET', body: null, result: [] },
      { promise: api.validationConfiguration(), path: 'validation-configuration', method: 'GET', body: null, result: config },
      { promise: api.syncCatalog(), path: 'catalog/sync', method: 'POST', body: null, result: { outcome: 'SUCCESS' } },
      { promise: api.updateValidationConfiguration(config), path: 'validation-configuration', method: 'PUT', body: config, result: config },
    ];
    for (const call of calls) {
      const req = http.expectOne({ url: `https://api.example.test/api/${call.path}`, method: call.method });
      expect(req.request.method).toBe(call.method);
      expect(req.request.body).toEqual(call.body);
      expect(req.request.detectContentTypeHeader()).toBe(call.body ? 'application/json' : null);
      req.flush(call.result); expect(await call.promise).toEqual(call.result);
    }
  });

  it.each([400, 409, 500])('rechaza %s con detalle legible y acotado, sin éxito ni caché nuevo', async status => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['catalog'], ['anterior']);
    const pending = client.fetchQuery({ queryKey: ['catalog'], queryFn: () => api.catalog() });
    const check = expect(pending).rejects.toThrow(`API ${status}: ${'x'.repeat(500)}`);
    http.expectOne('https://api.example.test/api/catalog').flush({ detail: 'x'.repeat(600), title: 'Título' }, { status, statusText: 'Error' });
    await check; expect(client.getQueryData(['catalog'])).toEqual(['anterior']); client.clear();
  });

  it.each([{ title: 'Conflicto' }, { arbitrary: {} }, 'texto plano'])('no convierte errores en [object Object]: %j', async body => {
    const pending = api.catalog(); const check = expect(pending).rejects.toThrow(
      `API 500: ${typeof body === 'string' ? body : 'title' in body ? body.title : 'Error del servidor'}`);
    http.expectOne('https://api.example.test/api/catalog').flush(body, { status: 500, statusText: 'Error' }); await check;
  });

  it('informa fallo de red sin serializar objetos', async () => {
    const pending = api.catalog(); const check = expect(pending).rejects.toThrow('No se pudo conectar con el servidor.');
    http.expectOne('https://api.example.test/api/catalog').error(new ProgressEvent('error')); await check;
  });

  it('no inicia HTTP con señal ya cancelada', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(api.catalog(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    http.expectNone('https://api.example.test/api/catalog');
  });

  it('Query cancela la única suscripción HTTP y limpia el listener', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let signal!: AbortSignal;
    const pending = client.fetchQuery({ queryKey: ['catalog'], queryFn: context => {
      signal = context.signal; return api.catalog(signal);
    } });
    const check = expect(pending).rejects.toBeDefined();
    const remove = vi.spyOn(signal, 'removeEventListener');
    const request = http.expectOne('https://api.example.test/api/catalog');
    await client.cancelQueries({ queryKey: ['catalog'] }); await check;
    expect(request.cancelled).toBe(true); expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(client.getQueryData(['catalog'])).toBeUndefined(); client.clear();
  });

  it.each([true, false])('retira listener al terminar (éxito=%s)', async success => {
    const controller = new AbortController(); const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const pending = api.catalog(controller.signal);
    const checked = success ? expect(pending).resolves.toEqual([]) : expect(pending).rejects.toThrow('API 409');
    const request = http.expectOne('https://api.example.test/api/catalog');
    if (success) request.flush([]); else request.flush({}, { status: 409, statusText: 'Conflict' });
    await checked; expect(remove).toHaveBeenCalledTimes(1);
    controller.abort(); expect(request.cancelled).toBe(true);
  });
});
