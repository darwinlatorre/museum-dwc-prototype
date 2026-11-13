import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideRouter, Router } from '@angular/router';
import { ImportConfirmation } from '../../importer/components/import-confirmation/import-confirmation';
import { CollectionsApi } from './collections-api';
import { CollectionApiError } from '../models/collection';
import type { ImportRequest } from '../models/collection';
import { CatalogMetadata } from '../../catalog/services/catalog-metadata';

const body: ImportRequest = { collectionId: null, name: ' Nueva ', context: 'collection', expectedRevision: null, configurationRevision: 7,
  catalogVersion: 3, idempotencyKey: '11111111-1111-4111-8111-111111111111', warningsConfirmed: false,
  headers: [' ID '], mapping: { ' ID ': 'occurrenceID' }, rows: [{ sourceRow: 19, originalValues: [' 0001 '], values: [' 0001 '] }] };
beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] }));
afterEach(() => { TestBed.inject(HttpTestingController).verify(); TestBed.resetTestingModule(); });
describe('cliente público de colecciones sin caché biológica', () => {
  it('conserva métodos, rutas, cuerpo literal y respuesta de las nueve operaciones', async () => {
    const api = TestBed.inject(CollectionsApi), http = TestBed.inject(HttpTestingController);
    const consent = { configurationRevision: 7, catalogVersion: 3, warningsConfirmed: true, expectedRevision: 4 };
    const add = { ...consent, headers: body.headers, mapping: body.mapping, row: body.rows[0] };
    const edit = { ...consent, values: [' 0002 '] };
    const checks: [() => Promise<unknown>, string, string, unknown][] = [
      [() => api.list(2, 10), '/api/collections?page=2&size=10', 'GET', null],
      [() => api.detail('c'), '/api/collections/c', 'GET', null],
      [() => api.records('c', 1, 25, 'TRASHED'), '/api/collections/c/records?page=1&size=25&trash=TRASHED', 'GET', null],
      [() => api.record('c', 'r'), '/api/collections/c/records/r', 'GET', null],
      [() => api.import(body), '/api/collections/imports', 'POST', body],
      [() => api.add('c', add), '/api/collections/c/records', 'POST', add],
      [() => api.edit('c', 'r', edit), '/api/collections/c/records/r', 'PUT', edit],
      [() => api.trash('c', 'r', 4), '/api/collections/c/records/r/trash', 'POST', { expectedRevision: 4 }],
      [() => api.restore('c', 'r', consent), '/api/collections/c/records/r/restore', 'POST', consent],
    ];
    for (const [run, url, method, expected] of checks) {
      const pending = run(), request = http.expectOne({ url, method });
      expect(request.request.body).toEqual(expected);
      request.flush({ result: 'literal' });
      expect(await pending).toEqual({ result: 'literal' });
    }
  });
  it('respeta defaults de paginación y AbortSignal previo/durante la solicitud', async () => {
    const api = TestBed.inject(CollectionsApi), http = TestBed.inject(HttpTestingController);
    const controller = new AbortController();
    const pending = api.records('c', undefined, undefined, undefined, controller.signal);
    const result = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    const request = http.expectOne('/api/collections/c/records?page=0&size=50&trash=ACTIVE');
    controller.abort(); await result; expect(request.cancelled).toBe(true);
    await expect(api.list(0, 50, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    http.expectNone('/api/collections?page=0&size=50');
  });
  it('distingue AUTHORITY_UNAVAILABLE público de un 503 sin resultado confirmado', async () => {
    const api = TestBed.inject(CollectionsApi), http = TestBed.inject(HttpTestingController);
    const before = structuredClone(body);
    const pending = api.import(body);
    const assertion = expect(pending).rejects.toMatchObject({
      problem: { status: 503, code: 'AUTHORITY_UNAVAILABLE', issues: [],
        detail: 'La configuración o el catálogo no están disponibles. Actualice los datos.' },
      unknownOutcome: false,
    });
    const request = http.expectOne({ url: '/api/collections/imports', method: 'POST' });
    expect(request.request.body).toEqual(before);
    request.flush({ status: 503, code: 'AUTHORITY_UNAVAILABLE', issues: [],
      detail: 'La configuración o el catálogo no están disponibles. Actualice los datos.' }, { status: 503, statusText: 'Servicio no disponible' });
    await assertion;
    expect(body).toEqual(before);
  });
  it.each([409, 422, 413, 503, 0])('preserva errores públicos y distingue incertidumbre HTTP%s', async status => {
    const api = TestBed.inject(CollectionsApi), http = TestBed.inject(HttpTestingController);
    const pending = api.import(body);
    const assertion = expect(pending).rejects.toMatchObject({ problem: { status, code: 'PUBLIC_CODE', issues: [] }, unknownOutcome: status === 0 || status >= 500 });
    http.expectOne('/api/collections/imports').flush({ status, detail: 'Mensaje público literal.', code: 'PUBLIC_CODE', issues: [] }, { status, statusText: 'Error' });
    await assertion;
    expect(new CollectionApiError({ status: 0 }, true).message).not.toContain('No se guardaron');
  });
});

describe('navegación pública del recibo de importación', () => {
  it.each(['nueva', 'existente'])('abre la colección %s con Router sin navegación de documento', async destination => {
    const fixture = TestBed.createComponent(ImportConfirmation);
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const collectionId = '22222222-2222-4222-8222-222222222222';
    const inputs = { ready: true, analysisRevision: 1, rowCount: 1, headers: body.headers, mapping: body.mapping,
      context: body.context, configurationRevision: body.configurationRevision, catalogVersion: body.catalogVersion,
      issues: [], duplicates: { equalRows: { groups: 0, affectedRows: 0 }, occurrenceIds: { groups: 0, affectedRows: 0 } },
      prepare: async () => structuredClone(body.rows) };
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const click = async (text: string) => {
      [...root.querySelectorAll('button')].find(button => button.textContent?.trim() === text)!.click();
      await fixture.whenStable();
    };
    if (destination === 'existente') {
      await click('Elegir colección existente');
      http.expectOne('/api/collections?page=0&size=50').flush({ items: [{ id: collectionId, name: 'Existente',
        context: body.context, revision: 4, activeCount: 2, trashCount: 0 }], page: 0, size: 50, totalElements: 1 });
      await expect.poll(() => root.querySelector(`option[value="${collectionId}"]`)).toBeTruthy();
      await fixture.whenStable();
      const select = root.querySelector<HTMLSelectElement>('[aria-label="Colección de destino"]')!;
      select.value = collectionId; select.dispatchEvent(new Event('change'));
    } else {
      const name = root.querySelector<HTMLInputElement>('[aria-label="Nombre de la colección"]')!;
      name.value = ' Nueva '; name.dispatchEvent(new Event('input'));
    }
    await fixture.whenStable();
    root.querySelector<HTMLInputElement>('.confirmation-consent input')!.click();
    await fixture.whenStable();
    http.expectNone('/api/collections/imports');
    await click('Confirmar e importar');
    const request = http.expectOne({ url: '/api/collections/imports', method: 'POST' });
    expect(request.request.body).toEqual({ ...body, collectionId: destination === 'existente' ? collectionId : null,
      name: destination === 'existente' ? null : ' Nueva ', expectedRevision: destination === 'existente' ? 4 : null,
      idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/) });
    request.flush({ idempotencyKey: request.request.body.idempotencyKey, collectionId,
      revision: destination === 'existente' ? 5 : 1, inserted: 1 });
    await expect.poll(() => root.textContent).toContain('Importación confirmada');
    await fixture.whenStable();
    const anchor = root.querySelector<HTMLAnchorElement>('a')!;
    expect(anchor.getAttribute('href')).toBe(`/collections/${collectionId}`);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    anchor.dispatchEvent(event);
    expect.soft(event.defaultPrevented).toBe(true);
    expect.soft(navigate).toHaveBeenCalledTimes(1);
    if (navigate.mock.calls.length) expect(router.serializeUrl(router.parseUrl(String(navigate.mock.calls[0][0])))).toBe(`/collections/${collectionId}`);
    http.expectNone('/api/collections/imports');
    navigate.mockRestore();
  });
});

describe('instantánea versionada sin romper consumidores del catálogo', () => {
  it('lee estado antes/términos/después, conserva versión y catálogo antiguo sin alterar el resultado', async () => {
    const api = TestBed.inject(CatalogMetadata), http = TestBed.inject(HttpTestingController);
    const state = { active: { snapshotVersion: 3 } };
    const terms = [{ name: 'occurrenceID', uri: 'uri', definition: 'literal', category: '', status: 'current' }];
    const pending = api.snapshot();
    http.expectOne('/api/catalog/status').flush(state); await Promise.resolve();
    http.expectOne('/api/catalog').flush(terms); await Promise.resolve();
    http.expectOne('/api/catalog/status').flush(state);
    expect(await pending).toEqual({ terms, snapshotVersion: 3 });
    const legacy = api.catalog(); http.expectOne('/api/catalog').flush(terms); expect(await legacy).toEqual(terms);
    const sync = api.syncCatalog(); const request = http.expectOne('/api/catalog/sync');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toBeNull(); request.flush({ outcome: 'SUCCESS' }); await sync;
  });
  it('rechaza una lectura atravesada por activación; no atribuye la versión nueva a términos viejos', async () => {
    const api = TestBed.inject(CatalogMetadata), http = TestBed.inject(HttpTestingController);
    const pending = api.snapshot(); const assertion = expect(pending).rejects.toThrow('El catálogo TDWG cambió durante la lectura');
    http.expectOne('/api/catalog/status').flush({ active: { snapshotVersion: 3 } }); await Promise.resolve();
    http.expectOne('/api/catalog').flush([]); await Promise.resolve();
    http.expectOne('/api/catalog/status').flush({ active: { snapshotVersion: 4 } }); await assertion;
  });
});
