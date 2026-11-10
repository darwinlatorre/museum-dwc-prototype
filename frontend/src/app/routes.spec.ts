import { DeferBlockState, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { routes } from './app.routes';
import { configurationFixture } from './testing/validation-fixture';
import { CatalogMetadata } from './features/catalog/services/catalog-metadata';
import { RecordSourcesMetadata } from './features/record-sources/services/record-sources-metadata';

describe('Rutas públicas del museo', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['catalog'], []);
    client.setQueryData(['validation-configuration'], configurationFixture([]));
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideLocationMocks(), provideTanStackQuery(client),
      { provide: CatalogMetadata, useValue: {} }, { provide: RecordSourcesMetadata, useValue: {} }] });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('redirige raíz y desconocidas a análisis con título y enlaces activos accesibles', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(TestBed.inject(Router).url).toBe('/analisis');
    expect(document.title).toContain('Análisis');
    expect(harness.routeNativeElement?.querySelector('a[aria-current=page]')?.getAttribute('href')).toBe('/analisis');
    await harness.navigateByUrl('/desconocida');
    expect(TestBed.inject(Router).url).toBe('/analisis');
  });
  it('abre catálogo directamente y conserva la instancia de análisis al cambiar de sección', async () => {
    const harness = await RouterTestingHarness.create('/catalogo');
    expect(harness.routeNativeElement?.querySelector('app-catalog')).toBeTruthy();
    await harness.navigateByUrl('/analisis');
    const blocks = await harness.fixture.getDeferBlocks();
    await blocks[0].render(DeferBlockState.Complete);
    await harness.fixture.whenStable();
    const importer = harness.routeNativeElement?.querySelector('app-import');
    expect(importer).toBeTruthy();
    await harness.navigateByUrl('/fuentes-de-registros');
    expect(harness.routeNativeElement?.querySelector('app-import')).toBe(importer);
    expect(importer?.parentElement?.hidden).toBe(true);
    await harness.navigateByUrl('/analisis');
    expect(harness.routeNativeElement?.querySelector('app-import')).toBe(importer);
    expect(importer?.parentElement?.hidden).toBe(false);
  });
  it.each([false, true])('protege borrador agregado=%s, URL, vista y cierre; aceptar descarta', async added => {
    const harness = await RouterTestingHarness.create('/fuentes-de-registros');
    const root = harness.routeNativeElement!;
    const input = root.querySelector<HTMLInputElement>('app-dwc-picker input')!;
    input.value = '  campo local  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();
    if (added) {
      [...root.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Agregar campo')!.click();
      await harness.fixture.whenStable();
    }
    const editor = root.querySelector('app-validation-configuration');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    await harness.navigateByUrl('/catalogo');
    expect(confirm).toHaveBeenCalledWith('Hay cambios sin guardar. ¿Desea descartarlos y salir de la configuración?');
    expect(TestBed.inject(Router).url).toBe('/fuentes-de-registros');
    expect(TestBed.inject(Location).path()).toBe('/fuentes-de-registros');
    expect(root.querySelector('app-validation-configuration')).toBe(editor);
    if (added) expect(root.textContent).toContain('  campo local  ');
    else expect(input.value).toBe('  campo local  ');
    confirm.mockReturnValue(true);
    await harness.navigateByUrl('/catalogo');
    expect(TestBed.inject(Router).url).toBe('/catalogo');
    expect(root.querySelector('app-validation-configuration')).toBeNull();
    const cleanUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanUnload); expect(cleanUnload.defaultPrevented).toBe(false);
    await harness.navigateByUrl('/fuentes-de-registros');
    expect(root.querySelector<HTMLInputElement>('app-dwc-picker input')!.value).toBe('');
    expect(root.textContent).not.toContain('campo local');
  });
  it('cancelar Atrás conserva la URL y el texto sin agregar; aceptar lo descarta', async () => {
    const harness = await RouterTestingHarness.create('/catalogo');
    TestBed.inject(Router).setUpLocationChangeListener();
    await harness.navigateByUrl('/fuentes-de-registros');
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('app-dwc-picker input')!;
    input.value = 'pendiente'; input.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const location = TestBed.inject(Location);
    location.back();
    await vi.waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/fuentes-de-registros');
    expect(location.path()).toBe('/fuentes-de-registros');
    expect(input.value).toBe('pendiente');
    confirm.mockReturnValue(true);
    await harness.navigateByUrl('/catalogo');
    expect(TestBed.inject(Router).url).toBe('/catalogo');
    expect(harness.routeNativeElement!.querySelector('app-validation-configuration')).toBeNull();
  });
  it('atrás y adelante restauran la ruta y el enlace activo sin reemplazar el shell', async () => {
    const harness = await RouterTestingHarness.create('/analisis');
    const shell = harness.routeNativeElement;
    await harness.navigateByUrl('/catalogo');
    const location = TestBed.inject(Location);
    TestBed.inject(Router).setUpLocationChangeListener();
    location.back();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/analisis'));
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement).toBe(shell);
    expect(shell?.querySelector('nav a[aria-current=page]')?.getAttribute('href')).toBe('/analisis');
    location.forward();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/catalogo'));
    await harness.fixture.whenStable();
    expect(shell?.querySelector('nav a[aria-current=page]')?.getAttribute('href')).toBe('/catalogo');
  });
});
