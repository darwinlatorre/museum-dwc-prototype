import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { Catalog } from '../features/catalog/catalog';
import { Api, BASE_URL } from '../core/api/api';
import { label, spanish } from '../core/i18n/localization';
import { configurationFixture } from './validation-fixture';

afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

describe('Presentación española y contratos oficiales', () => {
  it('conserva citas, URI e identificadores oficiales y localiza solamente presentación', async () => {
    TestBed.configureTestingModule({ providers: [provideTanStackQuery(new QueryClient()), { provide: Api, useValue: {} }] });
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
  let api: Api;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: BASE_URL, useValue: 'http://localhost:8080/api' }] });
    api = TestBed.inject(Api); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('consulta con cancelación y envía solo revisión y cinco contextos sin alterar campos libres', async () => {
    const body = configurationFixture(['  freeField  ']);
    const before = JSON.stringify(body);
    const controller = new AbortController();
    const reading = api.validationConfiguration(controller.signal);
    const get = http.expectOne({ url: 'http://localhost:8080/api/validation-configuration', method: 'GET' });
    expect(get.request.body).toBeNull(); expect(get.request.detectContentTypeHeader()).toBeNull();
    get.flush(body); expect(await reading).toEqual(body);
    const saving = api.updateValidationConfiguration(body);
    const put = http.expectOne({ url: 'http://localhost:8080/api/validation-configuration', method: 'PUT' });
    expect(put.request.detectContentTypeHeader()).toBe('application/json');
    expect(put.request.serializeBody()).toBe(before);
    expect(Object.keys(put.request.body)).toEqual(['revision', 'contexts']);
    put.flush(body); expect(await saving).toEqual(body);
    expect(JSON.stringify(body)).toBe(before);
  });
  it.each([400, 409])('expone el error real %s sin simular éxito', async status => {
    const body = configurationFixture(); const before = JSON.stringify(body);
    const saving = api.updateValidationConfiguration(body);
    const rejected = expect(saving).rejects.toThrow(
      `API ${status}: Revisión o campos inválidos. No se guardaron los cambios. Actualice los datos antes de volver a intentarlo.`,
    );
    http.expectOne({ url: 'http://localhost:8080/api/validation-configuration', method: 'PUT' })
      .flush('Revisión o campos inválidos', { status, statusText: 'Error' });
    await rejected; expect(JSON.stringify(body)).toBe(before);
  });
  it('conserva GET catálogo y POST sincronización sin cuerpo', async () => {
    const reading = api.catalog(new AbortController().signal);
    const get = http.expectOne({ url: 'http://localhost:8080/api/catalog', method: 'GET' });
    expect(get.request.body).toBeNull(); expect(get.request.detectContentTypeHeader()).toBeNull();
    get.flush([]); expect(await reading).toEqual([]);
    const syncing = api.syncCatalog();
    const post = http.expectOne({ url: 'http://localhost:8080/api/catalog/sync', method: 'POST' });
    expect(post.request.body).toBeNull(); expect(post.request.detectContentTypeHeader()).toBeNull();
    const result = { outcome: 'SUCCESS', status: {} };
    post.flush(result); expect(await syncing).toEqual(result);
  });
});
