import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { environment as development } from '../../../environments/environment.development';
import { CatalogMetadata } from '../../features/catalog/services/catalog-metadata';

describe('Application environments', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('usa baseUrl normal sin cargar JSON al arrancar HTTP', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(CatalogMetadata); const http = TestBed.inject(HttpTestingController);
    const pending = api.catalog();
    http.expectOne({ url: `${environment.baseUrl}/catalog`, method: 'GET' }).flush([]);
    expect(await pending).toEqual([]); http.expectNone('app-config.json'); http.verify();
  });
  it('define la base de mismo origen en ambos environments', () => {
    expect(environment).toEqual({ baseUrl: '/api' });
    expect(development).toEqual({ baseUrl: '/api' });
  });
});
