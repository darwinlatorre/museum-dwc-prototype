import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { CollectionsPage } from './collections-page';
import { collectionNavigation, unsavedCollection } from '../../guards/unsaved-collection';
import type { CollectionInfo, CollectionRecord } from '../../models/collection';

const id = '11111111-1111-4111-8111-111111111111';
const info: CollectionInfo = { id, name: ' Colección 01 ', context: 'other', revision: 7, activeCount: 26, trashCount: 1 };
const row: CollectionRecord = { id: '22222222-2222-4222-8222-222222222222', collectionId: id,
  headers: [' ID ', 'locality', 'nota'], mapping: { ' ID ': 'occurrenceID' }, sourceRow: 19,
  originalValues: [' 0001 ', ' A ', '<b>literal</b>'], values: ['0001', ' A ', '<b>literal</b>'],
  importKey: null, configurationRevision: 3, catalogVersion: 5, trashed: false };
@Component({ imports: [RouterOutlet], template: '<router-outlet [routerOutletData]="metadata" />' })
class Shell {
  metadata = { terms: signal([]), configuration: signal({ revision: 3, contexts: [{ context: 'other', requiredFields: ['occurrenceID'] }] }),
    snapshot: signal({ terms: [], snapshotVersion: 5 }), available: signal(true), refresh: async () => true };
}
@Component({ template: 'Otra sección' }) class Other {}

describe('Colecciones por controles públicos', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  const root = () => harness.routeNativeElement!;
  const button = (text: string) => [...root().querySelectorAll('button')].find(b => b.textContent?.trim() === text)!;
  const flushPage = (items = [row], page = 0, totalElements = 26, trash = 'ACTIVE', size = 25) => {
    http.expectOne(`/api/collections/${id}/records?page=${page}&size=${size}&trash=${trash}`).flush({ items, page, size, totalElements });
  };
  // HTTP Promise continuations and Query's notification task finish outside Angular's pending-task registry.
  const settle = async () => { await new Promise<void>(resolve => setTimeout(resolve, 0)); await harness.fixture.whenStable(); };
  const click = async (text: string) => { button(text).click(); await settle(); };
  const input = async (selector: string, value: string) => {
    const element = root().querySelector<HTMLInputElement>(selector)!;
    element.value = value; element.dispatchEvent(new Event('input', { bubbles: true })); await settle();
  };
  const open = async () => {
    harness = await RouterTestingHarness.create(`/collections/${id}`);
    http.expectOne(`/api/collections/${id}`).flush(info); await settle(); flushPage(); await settle();
  };
  const edit = async () => { await click('Ver / editar'); http.expectOne(`/api/collections/${id}/records/${row.id}`).flush(row); await settle(); };
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
      provideRouter([{ path: '', component: Shell, children: [
        { path: 'collections', component: CollectionsPage, canDeactivate: [unsavedCollection] },
        { path: 'collections/:id', component: CollectionsPage, canDeactivate: [unsavedCollection], canActivate: [collectionNavigation] },
        { path: 'other', component: Other },
      ] }])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify({ ignoreCancelled: true }); TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('lista paginada, contexto, cuentas y enlace directo, sin leer registros', async () => {
    harness = await RouterTestingHarness.create('/collections');
    expect(root().textContent).toContain('Cargando colecciones');
    http.expectOne('/api/collections?page=0&size=25').flush({ items: [info], page: 0, size: 25, totalElements: 26 }); await settle();
    expect(root().textContent).toContain('26 activos'); expect(root().textContent).toContain('1 en papelera');
    expect(root().querySelector('a.collection-link')?.getAttribute('href')).toBe(`/collections/${id}`);
    await click('Siguiente'); http.expectOne('/api/collections?page=1&size=25').flush({ items: [], page: 1, size: 25, totalElements: 26 }); await settle();
    expect(root().textContent).toContain('Página 2');
  });
  it('alinea esquemas heterogéneos por campo efectivo y conserva texto literal escapado', async () => {
    harness = await RouterTestingHarness.create(`/collections/${id}`); http.expectOne(`/api/collections/${id}`).flush(info); await settle();
    flushPage([row, { ...row, id: 'r2', headers: ['locality', 'occurrenceID', 'extra'], mapping: {}, values: [' B ', '0002', ' Z '] }]); await settle();
    const rows = root().querySelectorAll('tbody tr');
    expect([...rows[1].querySelectorAll('td[data-cell]')].map(c => c.textContent)).toEqual(['0002', ' B ', '—', ' Z ']);
    expect(rows[0].textContent).toContain('<b>literal</b>'); expect(rows[0].querySelector('b')).toBeNull();
    expect(root().querySelector('thead')?.textContent).toContain('occurrenceID');
    await click('Siguiente'); flushPage([], 1); await settle(); expect(root().textContent).toContain('Página 2');
  });
  it('edita todos los valores aunque se filtren campos y no transmite originales ni esquema', async () => {
    await open(); await edit();
    await input('[aria-label="Buscar campos del editor"]', 'occurrenceID');
    await input('textarea[data-value="0"]', ' 0009 '); await click('Guardar cambios');
    const request = http.expectOne({ method: 'PUT', url: `/api/collections/${id}/records/${row.id}` });
    expect(request.request.body).toEqual({ expectedRevision: 7, configurationRevision: 3, catalogVersion: 5, warningsConfirmed: false, values: [' 0009 ', ' A ', '<b>literal</b>'] });
    request.flush({ ...info, revision: 8 }); await settle(); flushPage(); await settle();
    expect(root().textContent).toContain('Revisión 8'); expect(root().querySelector('form')).toBeNull();
  });
  it('alta desde esquema seleccionado añade obligatorios y campos libres sin normalizar', async () => {
    await open(); await click('Agregar registro');
    await input('textarea[data-value="0"]', ' 0000 ');
    await click('Guardar nuevo registro');
    const request = http.expectOne({ method: 'POST', url: `/api/collections/${id}/records` });
    expect(request.request.body).toEqual({ expectedRevision: 7, configurationRevision: 3, catalogVersion: 5, warningsConfirmed: false,
      headers: ['occurrenceID'], mapping: {}, row: { sourceRow: 1, originalValues: [' 0000 '], values: [' 0000 '] } });
    request.flush({ ...info, revision: 8, activeCount: 27 }); await settle(); flushPage(); await settle(); expect(root().textContent).toContain('27 activos');
  });
  it.each(['DUPLICATE', 'VALIDATION_FAILED', 'WARNINGS_UNCONFIRMED'])('rechazo %s conserva borrador y presenta incidencia tipada', async code => {
    await open(); await edit(); await input('textarea[data-value="0"]', '0009'); await click('Guardar cambios');
    http.expectOne(`/api/collections/${id}/records/${row.id}`).flush({ code, detail: 'Mensaje literal', issues: [{ field: 'occurrenceID', row: 19, severity: code === 'WARNINGS_UNCONFIRMED' ? 'WARNING' : 'ERROR', description: 'Incidencia', context: 'other', configurationRevision: 3 }] }, { status: code === 'DUPLICATE' ? 409 : 422, statusText: 'Rechazo' }); await settle();
    expect(root().querySelector<HTMLTextAreaElement>('textarea[data-value="0"]')?.value).toBe('0009');
    expect(root().textContent).toContain('occurrenceID'); expect(root().textContent).toContain('Fila 19'); expect(root().textContent).toContain('Incidencia'); expect(root().textContent).toContain('Revisión 7');
    if (code === 'WARNINGS_UNCONFIRMED') {
      expect(button('Guardar cambios').disabled).toBe(true);
      const consent = root().querySelector<HTMLInputElement>('[aria-label="Confirmar advertencias"]')!; consent.click(); await settle();
      await click('Guardar cambios'); const request = http.expectOne(`/api/collections/${id}/records/${row.id}`); expect(request.request.body.warningsConfirmed).toBe(true);
      request.flush({ ...info, revision: 8 }); await settle(); flushPage(); await settle();
    }
  });
  it.each(['REVISION_CONFLICT', 'CONFIGURATION_CHANGED', 'CATALOG_CHANGED'])('conflicto %s exige actualización explícita sin descartar ante fallo', async code => {
    await open(); await edit(); await input('textarea[data-value="0"]', '0009'); await click('Guardar cambios');
    http.expectOne(`/api/collections/${id}/records/${row.id}`).flush({ code, detail: 'Actualice' }, { status: 409, statusText: 'Conflicto' }); await settle();
    expect(button('Guardar cambios').disabled).toBe(true); await click('Actualizar y reanalizar borrador');
    http.expectOne(`/api/collections/${id}`).flush({}, { status: 503, statusText: 'No disponible' }); await settle();
    expect(root().querySelector<HTMLTextAreaElement>('textarea[data-value="0"]')?.value).toBe('0009'); expect(button('Guardar cambios').disabled).toBe(true);
    await click('Actualizar y reanalizar borrador'); http.expectOne(`/api/collections/${id}`).flush({ ...info, revision: 9 }); await settle();
    http.expectOne(`/api/collections/${id}/records/${row.id}`).flush(row); await settle(); flushPage(); await settle();
    await click('Guardar cambios'); const request = http.expectOne(`/api/collections/${id}/records/${row.id}`); expect(request.request.body.expectedRevision).toBe(9);
    request.flush({ ...info, revision: 10 }); await settle(); flushPage(); await settle();
  });
  it('resultado incierto del alta no reintenta; exige reconciliar antes de nuevas escrituras', async () => {
    await open(); await click('Agregar registro'); await input('textarea[data-value="0"]', '0009'); await click('Guardar nuevo registro');
    http.expectOne(`/api/collections/${id}/records`).error(new ProgressEvent('error')); await settle();
    expect(root().textContent).toContain('Resultado desconocido'); expect(button('Guardar nuevo registro').disabled).toBe(true);
    expect(root().querySelector<HTMLTextAreaElement>('textarea[data-value="0"]')?.value).toBe('0009');
    await click('Actualizar para reconciliar'); http.expectOne(`/api/collections/${id}`).flush({ ...info, revision: 8, activeCount: 27 }); await settle(); flushPage(); await settle();
    expect(root().textContent).toContain('Revisión 8'); expect(button('Guardar nuevo registro').disabled).toBe(true);
    await click('He comprobado los registros del servidor'); expect(root().querySelector('form')).toBeNull();
  });
  it('retirar requiere confirmación, cancelar no escribe; restaura con revisiones y consentimiento', async () => {
    await open(); await click('Retirar'); expect(root().querySelector('[role=dialog]')?.textContent).toContain('papelera');
    await click('Cancelar retiro'); http.expectNone(request => request.method === 'POST');
    await click('Retirar'); await click('Confirmar retiro'); const request = http.expectOne(`/api/collections/${id}/records/${row.id}/trash`);
    expect(request.request.body).toEqual({ expectedRevision: 7 }); request.flush({ ...info, revision: 8, activeCount: 25, trashCount: 2 }); await settle(); flushPage(); await settle();
    const filter = root().querySelector<HTMLSelectElement>('[aria-label="Estado de registros"]')!; filter.value = 'TRASHED'; filter.dispatchEvent(new Event('change')); await settle(); flushPage([{ ...row, trashed: true }], 0, 2, 'TRASHED'); await settle();
    await click('Restaurar'); await click('Confirmar restauración'); const restore = http.expectOne(`/api/collections/${id}/records/${row.id}/restore`);
    expect(restore.request.body).toEqual({ expectedRevision: 8, configurationRevision: 3, catalogVersion: 5, warningsConfirmed: false });
    restore.flush({ code: 'DUPLICATE', detail: 'Duplicado activo' }, { status: 409, statusText: 'Conflicto' }); await settle(); expect(root().textContent).toContain('Duplicado activo'); expect(root().textContent).toContain('25 activos');
  });
  it('cancelación de salida conserva URL, borrador, beforeunload; Escape devuelve foco', async () => {
    await open(); await edit(); await input('textarea[data-value="0"]', '0009');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await TestBed.inject(Router).navigateByUrl('/other'); await settle(); expect(TestBed.inject(Router).url).toBe(`/collections/${id}`);
    const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
    root().querySelector('form')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await settle(); expect(root().querySelector('form')).not.toBeNull();
    confirm.mockReturnValue(true); await click('Cancelar edición'); expect(root().querySelector('form')).toBeNull();
    expect(document.activeElement?.textContent).toContain('Ver / editar');
  });
  it('agrega campo libre literal y conserva columnas del esquema seleccionado más obligatorios', async () => {
    await open(); await click('Agregar registro'); vi.spyOn(window, 'confirm').mockReturnValue(true);
    const select = root().querySelector<HTMLSelectElement>('[aria-label="Esquema del nuevo registro"]')!;
    select.value = row.id; select.dispatchEvent(new Event('change')); await settle();
    expect(root().querySelectorAll('textarea')).toHaveLength(3);
    await input('app-dwc-picker input', ' Campo libre '); await click('Agregar campo');
    await input('textarea[data-value="0"]', '0009'); await input('textarea[data-value="3"]', '  00A\n z  ');
    await click('Guardar nuevo registro'); const request = http.expectOne(`/api/collections/${id}/records`);
    expect(request.request.body.headers).toEqual(['occurrenceID', 'locality', 'nota', ' Campo libre ']);
    expect(request.request.body.row).toEqual({ sourceRow: 1, values: ['0009', '', '', '  00A\n z  '], originalValues: ['0009', '', '', '  00A\n z  '] });
    request.flush({ ...info, revision: 8 }); await settle(); flushPage(); await settle();
  });
  it('colección sin activos puede tomar esquema de papelera sin descargar la colección completa', async () => {
    harness = await RouterTestingHarness.create(`/collections/${id}`); http.expectOne(`/api/collections/${id}`).flush({ ...info, activeCount: 0 }); await settle(); flushPage([], 0, 0); await settle();
    await click('Agregar registro'); await click('Buscar esquema en papelera');
    flushPage([{ ...row, trashed: true }], 0, 1, 'TRASHED'); await settle();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const select = root().querySelector<HTMLSelectElement>('[aria-label="Esquema del nuevo registro"]')!; select.value = row.id; select.dispatchEvent(new Event('change')); await settle();
    expect(root().querySelectorAll('textarea')).toHaveLength(3); expect(root().textContent).toContain('no de toda la colección');
    http.expectNone(request => request.method !== 'GET');
  });
  it('página de 50 y filtro ALL usa la consulta exacta y distingue vacío, fallo y recuperación', async () => {
    await open(); const size = root().querySelector<HTMLSelectElement>('[aria-label="Registros por página"]')!; size.value = '50'; size.dispatchEvent(new Event('change')); await settle();
    flushPage([], 0, 0, 'ACTIVE', 50); await settle(); expect(root().textContent).toContain('No hay registros');
    const filter = root().querySelector<HTMLSelectElement>('[aria-label="Estado de registros"]')!; filter.value = 'ALL'; filter.dispatchEvent(new Event('change')); await settle();
    http.expectOne(`/api/collections/${id}/records?page=0&size=50&trash=ALL`).flush({ detail: 'Lectura fallida' }, { status: 503, statusText: 'Error' }); await settle();
    expect(root().textContent).toContain('Lectura fallida'); await click('Actualizar'); http.expectOne(`/api/collections/${id}`).flush(info); await settle();
    flushPage([row], 0, 1, 'ALL', 50); await settle(); expect(root().textContent).toContain('0001');
  });
  it('errores bloquean sin escrituras adicionales hasta corregir texto, sin tocar originales', async () => {
    await open(); await edit(); await input('textarea[data-value="0"]', 'dup'); await click('Guardar cambios');
    http.expectOne(`/api/collections/${id}/records/${row.id}`).flush({ code: 'VALIDATION_FAILED', issues: [{ field: 'occurrenceID', row: null, severity: 'ERROR', description: 'Requerido' }] }, { status: 422, statusText: 'Error' }); await settle();
    expect(button('Guardar cambios').disabled).toBe(true); await click('Guardar cambios'); http.expectNone(request => request.method === 'PUT');
    expect(root().querySelector('pre')?.textContent).toBe(' 0001 ');
    await input('textarea[data-value="0"]', 'nuevo'); expect(button('Guardar cambios').disabled).toBe(false);
  });
  it('restauración con advertencias requiere consentimiento explícito y actualiza cuentas reales', async () => {
    harness = await RouterTestingHarness.create(`/collections/${id}`); http.expectOne(`/api/collections/${id}`).flush(info); await settle(); flushPage([{ ...row, trashed: true }]); await settle();
    await click('Restaurar'); await click('Confirmar restauración');
    http.expectOne(`/api/collections/${id}/records/${row.id}/restore`).flush({ code: 'WARNINGS_UNCONFIRMED', issues: [{ field: 'nota', row: 19, severity: 'WARNING', description: 'Campo libre' }] }, { status: 422, statusText: 'Advertencias' }); await settle();
    expect(button('Confirmar restauración').disabled).toBe(true);
    root().querySelector<HTMLInputElement>('[aria-label="Confirmar advertencias"]')!.click(); await settle(); await click('Confirmar restauración');
    const request = http.expectOne(`/api/collections/${id}/records/${row.id}/restore`); expect(request.request.body.warningsConfirmed).toBe(true);
    request.flush({ ...info, revision: 8, activeCount: 27, trashCount: 0 }); await settle(); flushPage(); await settle();
    expect(root().querySelector('dialog')).toBeNull(); expect(root().textContent).toContain('27 activos'); expect(root().textContent).toContain('0 en papelera');
  });
  it('cambiar fila, página o colección pide permiso y cancelar deja valores intactos', async () => {
    await open(); await edit(); await input('textarea[data-value="0"]', 'borrador'); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await click('Siguiente'); http.expectNone(`/api/collections/${id}/records?page=1&size=25&trash=ACTIVE`);
    await click('Agregar registro'); expect(root().querySelector<HTMLTextAreaElement>('textarea[data-value="0"]')!.value).toBe('borrador');
    await TestBed.inject(Router).navigateByUrl('/collections/other-id'); await settle(); expect(TestBed.inject(Router).url).toBe(`/collections/${id}`); http.expectNone('/api/collections/other-id');
    expect(confirm).toHaveBeenCalledTimes(3);
  });
  it('cambio de metadatos bloquea guardado hasta actualizar explícitamente, conservando valores', async () => {
    await open(); await edit(); await input('textarea[data-value="0"]', 'borrador');
    const shell = harness.routeDebugElement!.componentInstance as Shell;
    shell.metadata.configuration.set({ revision: 4, contexts: [{ context: 'other', requiredFields: ['occurrenceID'] }] }); await settle();
    expect(button('Guardar cambios').disabled).toBe(true); expect(root().textContent).toContain('Los metadatos cambiaron');
    expect(root().querySelector<HTMLTextAreaElement>('textarea[data-value="0"]')!.value).toBe('borrador'); http.expectNone(request => request.method === 'PUT');
  });
  it('retirar la última fila devuelve foco al encabezado cuando desaparece su disparador', async () => {
    await open(); await click('Retirar'); await click('Confirmar retiro');
    http.expectOne(`/api/collections/${id}/records/${row.id}/trash`).flush({ ...info, revision: 8, activeCount: 0, trashCount: 27 }); await settle();
    flushPage([], 0, 0); await settle();
    expect(root().querySelector('dialog')).toBeNull(); expect(document.activeElement?.id).toBe('collections-title');
  });
  it('Escape cierra confirmación nativa y devuelve foco sin retirar', async () => {
    await open(); const trigger = button('Retirar'); trigger.focus(); await click('Retirar');
    root().querySelector('dialog')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await settle();
    expect(root().querySelector('dialog')).toBeNull(); expect(document.activeElement).toBe(trigger); http.expectNone(request => request.method === 'POST');
  });
  it('incertidumbre se mantiene al salir y regresar; reconciliar no repite POST', async () => {
    await open(); await click('Agregar registro'); await input('textarea[data-value="0"]', 'nuevo'); await click('Guardar nuevo registro');
    http.expectOne(`/api/collections/${id}/records`).error(new ProgressEvent('error')); await settle();
    vi.spyOn(window, 'confirm').mockReturnValue(true); await TestBed.inject(Router).navigateByUrl('/other'); await settle();
    await TestBed.inject(Router).navigateByUrl(`/collections/${id}`); await settle(); http.expectOne(`/api/collections/${id}`).flush(info); await settle(); flushPage(); await settle();
    expect(button('Agregar registro').disabled).toBe(true); expect(root().textContent).toContain('Resultado desconocido'); http.expectNone(request => request.method === 'POST');
  });
  it('cancela detalle de fila pendiente al salir, sin mostrar respuestas de otra sesión', async () => {
    await open(); await click('Ver / editar'); const request = http.expectOne(`/api/collections/${id}/records/${row.id}`);
    await TestBed.inject(Router).navigateByUrl('/other'); await settle(); expect(request.cancelled).toBe(true); expect(root().querySelector('form')).toBeNull();
  });
  it('acota columnas anchas sin perder acceso a campos ni valores editados fuera de ventana', async () => {
    const wide = { ...row, headers: Array.from({ length: 61 }, (_, i) => `campo${i}`), mapping: {},
      originalValues: Array.from({ length: 61 }, (_, i) => ` 0${i} `), values: Array.from({ length: 61 }, (_, i) => ` 0${i} `) };
    harness = await RouterTestingHarness.create(`/collections/${id}`); http.expectOne(`/api/collections/${id}`).flush(info); await settle(); flushPage([wide], 0, 1); await settle();
    expect(root().querySelectorAll('td[data-cell]')).toHaveLength(25);
    await click('Columnas siguientes'); expect(root().querySelector('thead')?.textContent).toContain('campo25');
    await click('Columnas siguientes'); expect(root().querySelector('thead')?.textContent).toContain('campo60'); expect(root().querySelectorAll('td[data-cell]')).toHaveLength(11);
    await click('Ver / editar'); http.expectOne(`/api/collections/${id}/records/${row.id}`).flush(wide); await settle();
    await input('[aria-label="Buscar campos del editor"]', 'campo60'); await input('textarea[data-value="60"]', ' 000A '); await click('Guardar cambios');
    const request = http.expectOne(`/api/collections/${id}/records/${row.id}`);
    expect(request.request.body.values).toEqual([...wide.values.slice(0, 60), ' 000A ']);
    request.flush({ ...info, revision: 8 }); await settle(); flushPage([wide], 0, 1); await settle();
  });
  it('cancela página pendiente al navegar y no presenta datos de la colección anterior', async () => {
    await open(); await click('Siguiente'); const pending = http.expectOne(`/api/collections/${id}/records?page=1&size=25&trash=ACTIVE`);
    await TestBed.inject(Router).navigateByUrl('/collections/other-id'); await settle(); expect(pending.cancelled).toBe(true);
    http.expectOne('/api/collections/other-id').flush({ ...info, id: 'other-id', name: 'Otra' }); await settle();
    http.expectOne('/api/collections/other-id/records?page=0&size=25&trash=ACTIVE').flush({ items: [], page: 0, size: 25, totalElements: 0 }); await settle();
    expect(root().textContent).toContain('Otra'); expect(root().textContent).not.toContain('<b>literal</b>');
  });
});
