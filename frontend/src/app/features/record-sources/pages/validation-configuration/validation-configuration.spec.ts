import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import type { ValidationConfiguration } from '../../models/validation-configuration';
import { ValidationConfigurationEditor } from './validation-configuration';
import { RecordSourcesMetadata } from '../../services/record-sources-metadata';
import { configurationFixture, contextKeys } from '../../../../testing/validation-fixture';

async function setup(original: ValidationConfiguration = configurationFixture(['customField'])) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  client.setQueryData(['validation-configuration'], original);
  const api = {
    validationConfiguration: vi.fn().mockResolvedValue(original),
    updateValidationConfiguration: vi.fn().mockImplementation(async body => ({ ...body, revision: 8 })),
  };
  TestBed.configureTestingModule({ providers: [provideTanStackQuery(client), { provide: RecordSourcesMetadata, useValue: api }] });
  const f = TestBed.createComponent(ValidationConfigurationEditor);
  f.componentRef.setInput('configuration', original);
  f.componentRef.setInput('terms', [{ name: 'eventDate', uri: '', definition: '', category: '', status: 'recommended' }]);
  await f.whenStable();
  const root = f.nativeElement as HTMLElement;
  const button = (name: string) => [...root.querySelectorAll('button')].find(b => b.textContent?.trim() === name || b.getAttribute('aria-label') === name)!;
  const click = async (name: string) => { expect(button(name), name).toBeTruthy(); button(name).click(); await f.whenStable(); };
  const type = async (value: string) => {
    const input = root.querySelector<HTMLInputElement>('app-dwc-picker input')!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await f.whenStable();
  };
  return { f, root, client, api, original, button, click, type };
}
beforeEach(() => vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} })));
afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

describe('Editor global público', () => {
  it('alterna sin mover filas ni foco y guarda ambas listas completas con búsqueda activa', async () => {
    const { f, root, api, button, click, original } = await setup(configurationFixture(['first', 'customField', 'last']));
    const rows = [...root.querySelectorAll('.configuration-fields li')];
    const toggle = button('Cambiar customField a opcional');
    expect(toggle).toBeTruthy();
    toggle.focus();
    await click('Cambiar customField a opcional');
    expect([...root.querySelectorAll('.configuration-fields li')]).toEqual(rows);
    expect(document.activeElement).toBe(toggle);
    expect(toggle.textContent).toContain('Opcional');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(root.textContent).toContain('3 campos · 2 obligatorios · 1 opcionales');
    const search = root.querySelector<HTMLInputElement>('input[type=search]')!;
    search.value = 'CUSTOM'; search.dispatchEvent(new Event('input')); await f.whenStable();
    expect(root.querySelectorAll('.configuration-fields li')).toHaveLength(1);
    await click('Guardar configuración');
    await vi.waitFor(() => expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(1));
    expect(api.updateValidationConfiguration.mock.calls[0][0]).toEqual({ revision: 7, contexts: original.contexts.map(item => ({ ...item,
      requiredFields: item.context === 'collection' ? ['first', 'last'] : item.requiredFields,
      optionalFields: item.context === 'collection' ? ['customField'] : [],
    })) });
    await click('Cambiar customField a obligatorio');
    expect(toggle.textContent).toContain('Obligatorio');
    await click('Guardar configuración');
    await vi.waitFor(() => expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(2));
    expect(api.updateValidationConfiguration.mock.calls[1][0].contexts[0]).toEqual({ context: 'collection',
      requiredFields: ['first', 'last', 'customField'], optionalFields: [] });
  });

  it('rehidrata opcionales, busca ambos estados, rechaza duplicado y Quitar elimina el opcional', async () => {
    const original = configurationFixture(['customField']);
    original.contexts[0].optionalFields = ['  optionalValue  '];
    const { f, root, api, type, button, click } = await setup(original);
    expect(button('Cambiar   optionalValue   a obligatorio').textContent).toContain('Opcional');
    await type('  optionalValue  ');
    expect(button('Agregar campo').disabled).toBe(true);
    expect(root.textContent).toContain('Este campo ya está configurado en el contexto.');
    await click('Limpiar Agregar campo obligatorio');
    const search = root.querySelector<HTMLInputElement>('input[type=search]')!;
    search.value = 'VALUE'; search.dispatchEvent(new Event('input')); await f.whenStable();
    expect(root.querySelectorAll('.configuration-fields li')).toHaveLength(1);
    await click('Quitar   optionalValue  ');
    await click('Guardar configuración');
    await vi.waitFor(() => expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(1));
    expect(api.updateValidationConfiguration.mock.calls[0][0]).toEqual({ ...original,
      contexts: original.contexts.map(item => ({ ...item, optionalFields: [] })) });
    await click('Limpiar búsqueda');
    expect(root.querySelectorAll('.configuration-fields li')).toHaveLength(1);
    expect(root.querySelector('.configuration-fields')?.textContent).not.toContain('optionalValue');
  });

  it('cuenta el límite combinado sin enviar escrituras al rechazar el campo 501', async () => {
    const original = configurationFixture(['customField']);
    original.contexts[0].optionalFields = Array.from({ length: 499 }, (_, i) => `optional${i}`);
    const { root, type, button, api } = await setup(original);
    await type('overflow');
    expect(button('Agregar campo').disabled).toBe(true);
    expect(root.textContent).toContain('No se pueden agregar más de 500 campos por contexto.');
    expect(api.updateValidationConfiguration).not.toHaveBeenCalled();
  });

  it('normaliza lecturas legadas y guarda listas opcionales explícitas en las cinco fuentes', async () => {
    const legacy = { revision: 7, contexts: contextKeys.map(context => ({ context, requiredFields: ['customField'] })) };
    const { api, click, root } = await setup(legacy);
    expect(root.querySelectorAll('.configuration-fields li')).toHaveLength(1);
    await click('Cambiar customField a opcional');
    await click('Guardar configuración');
    await vi.waitFor(() => expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(1));
    expect(api.updateValidationConfiguration.mock.calls[0][0]).toEqual({ revision: 7, contexts: legacy.contexts.map(item => ({
      ...item, requiredFields: item.context === 'collection' ? [] : ['customField'],
      optionalFields: item.context === 'collection' ? ['customField'] : [],
    })) });
    expect(legacy.contexts.every(item => !('optionalFields' in item))).toBe(true);
  });

  it('presenta cinco fuentes seleccionables con recuentos reales y un espacio de campos dedicado', async () => {
    const { f, root, api } = await setup();
    expect(root.querySelector('h2')?.textContent).toBe('Fuentes de registros biológicos');
    const sources = [...root.querySelectorAll<HTMLButtonElement>('.configuration-source')];
    expect(sources.map(source => source.value)).toEqual([...contextKeys]);
    for (const source of sources) {
      source.click(); await f.whenStable();
      expect(source.getAttribute('aria-pressed')).toBe('true');
      expect(sources.filter(item => item.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
      expect(source.textContent).toContain('1 campos');
      expect(root.querySelector('#fields-title')?.textContent).toContain(source.querySelector('strong')!.textContent);
      expect(root.querySelectorAll('.configuration-fields li')).toHaveLength(1);
    }
    expect(api.updateValidationConfiguration).not.toHaveBeenCalled();
  });

  it('filtra solo la presentación, limpia la búsqueda y guarda todos los campos de las cinco fuentes', async () => {
    const { f, root, api, original, button, click, type } = await setup();
    const search = root.querySelector<HTMLInputElement>('input[type=search]');
    expect(search).toBeTruthy();
    const filter = async (value: string) => {
      search!.value = value;
      search!.dispatchEvent(new Event('input', { bubbles: true }));
      await f.whenStable();
    };
    await type('  hiddenValue  '); await click('Agregar campo');
    await filter('CUSTOM');
    expect(root.querySelector('.configuration-fields')?.textContent).toContain('customField');
    expect(root.querySelector('.configuration-fields')?.textContent).not.toContain('hiddenValue');
    expect(root.textContent).toContain('1 de 2 campos');
    await filter('no-match');
    expect(root.textContent).toContain('Ningún campo coincide con la búsqueda.');
    expect(button('Guardar configuración').disabled).toBe(false);
    await click('Limpiar búsqueda');
    expect(search!.value).toBe('');
    expect(root.querySelectorAll('.configuration-fields li')).toHaveLength(2);
    await filter('custom');
    await click('Guardar configuración');
    await vi.waitFor(() => expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(1));
    expect(api.updateValidationConfiguration.mock.calls[0][0]).toEqual({ revision: 7,
      contexts: original.contexts.map(item => item.context === 'collection'
        ? { ...item, requiredFields: ['customField', '  hiddenValue  '] } : item) });
    expect(original).toEqual(configurationFixture(['customField']));
  });

  it('usa el selector compartido, preserva texto libre y limpieza sin duplicados y guarda cinco contextos', async () => {
    const { f, root, client, api, original, button, click, type } = await setup();
    const before = JSON.stringify(original);
    expect([...root.querySelectorAll<HTMLButtonElement>('.configuration-source')].map(button => button.value)).toEqual([...contextKeys]);
    expect(button('Guardar configuración').disabled).toBe(true);
    await type('  freeValue  ');
    await click('Agregar campo');
    expect(root.textContent).toContain('Cambios sin guardar');
    expect(root.querySelector('.configuration-fields')?.textContent).toContain('  freeValue  ');
    await type('  freeValue  ');
    expect(root.textContent).toContain('Este campo ya está configurado');
    expect(button('Agregar campo').disabled).toBe(true);
    await click('Limpiar Agregar campo obligatorio');
    expect(root.querySelector<HTMLInputElement>('app-dwc-picker input')?.value).toBe('');
    await click('Quitar customField');
    await click('Guardar configuración');
    await vi.waitFor(() => expect(root.textContent).toContain('Configuración guardada en el servidor.'));
    expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(1);
    const body = api.updateValidationConfiguration.mock.calls[0][0];
    expect(body).toEqual({ revision: 7, contexts: original.contexts.map(item => item.context === 'collection' ? { ...item, requiredFields: ['  freeValue  '] } : item) });
    expect(client.getQueryData(['validation-configuration'])).toEqual({ ...body, revision: 8 });
    expect(JSON.stringify(original)).toBe(before);
    expect(root.textContent).toContain('Sin cambios pendientes');
    expect(f.componentInstance.client).toBe(client);
  });

  it.each(['Fallo de conexión', 'API 400: campos inválidos', 'API 409: revisión obsoleta'])('conserva cambios y revisión ante %s sin éxito ni reescritura', async message => {
    const { f, root, client, api, original, click, type } = await setup();
    api.updateValidationConfiguration.mockRejectedValue(new Error(message));
    await type('  freeValue  ');
    await click('Agregar campo');
    await click('Guardar configuración');
    await vi.waitFor(() => expect(root.querySelector('[role=alert]')?.textContent).toContain(message));
    expect(root.textContent).toContain('Cambios sin guardar');
    expect(root.textContent).not.toContain('Configuración guardada');
    expect(root.querySelector('.configuration-fields')?.textContent).toContain('  freeValue  ');
    expect(client.getQueryData(['validation-configuration'])).toEqual(original);
    expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(1);
    expect(api.updateValidationConfiguration.mock.calls[0][0].revision).toBe(7);
    // Refresh failure must not destroy the local changes either.
    api.validationConfiguration.mockRejectedValueOnce(new Error('Actualización fallida'));
    await click('Actualizar del servidor y descartar cambios locales');
    await vi.waitFor(() => expect(root.textContent).toContain('Actualización fallida'));
    expect(root.querySelector('.configuration-fields')?.textContent).toContain('  freeValue  ');
    const latest = { ...configurationFixture(['nuevo']), revision: 9 };
    api.validationConfiguration.mockResolvedValue(latest);
    await click('Actualizar del servidor y descartar cambios locales');
    await vi.waitFor(() => expect(root.textContent).toContain('Configuración actualizada desde el servidor.'));
    expect(root.querySelector('.configuration-fields')?.textContent).toContain('nuevo');
    expect(root.querySelector('.configuration-fields')?.textContent).not.toContain('freeValue');
    expect(client.getQueryData(['validation-configuration'])).toEqual(latest);
    expect(api.validationConfiguration.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
    expect(root.textContent).toContain('Sin cambios pendientes');
    await f.whenStable();
  });

  it('edita un contexto sin alterar los otros y admite una lista vacía explícita', async () => {
    const { f, root, api, click, original } = await setup();
    root.querySelector<HTMLButtonElement>('.configuration-source[value="permit"]')!.click();
    await f.whenStable();
    await click('Quitar customField');
    await click('Guardar configuración');
    await vi.waitFor(() => expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(1));
    expect(api.updateValidationConfiguration.mock.calls[0][0]).toEqual({ revision: 7, contexts: original.contexts.map(item => item.context === 'permit' ? { ...item, requiredFields: [] } : item) });
  });

  it('mantiene cambios locales si llega una revisión nueva en vez de cambiar su revisión a escondidas', async () => {
    const { f, root, click, type, api } = await setup();
    await type('local'); await click('Agregar campo');
    f.componentRef.setInput('configuration', { ...configurationFixture(['ajeno']), revision: 9 });
    await f.whenStable();
    expect(root.textContent).toContain('Hay una revisión más reciente');
    expect(root.querySelector('.configuration-fields')?.textContent).toContain('local');
    expect(root.querySelector('.configuration-fields')?.textContent).not.toContain('ajeno');
    await click('Guardar configuración');
    await vi.waitFor(() => expect(api.updateValidationConfiguration).toHaveBeenCalledTimes(1));
    expect(api.updateValidationConfiguration.mock.calls[0][0].revision).toBe(7);
  });

  it('acepta 200 caracteres y 500 campos, y rechaza el campo 501 sin enviar una escritura', async () => {
    const { f, root, type, click, button, api } = await setup();
    const fields = Array.from({ length: 499 }, (_, i) => `field${i}`);
    f.componentRef.setInput('configuration', configurationFixture(fields));
    await f.whenStable();
    await type('a'.repeat(200));
    expect(button('Agregar campo').disabled).toBe(false);
    await click('Agregar campo');
    expect(root.querySelectorAll('.configuration-fields li')).toHaveLength(500);
    await type('field501');
    expect(button('Agregar campo').disabled).toBe(true);
    expect(root.textContent).toContain('No se pueden agregar más de 500 campos por contexto.');
    expect(api.updateValidationConfiguration).not.toHaveBeenCalled();
  });

  it('no acepta campos vacíos ni mayores de 200 caracteres', async () => {
    const { button, click, type, api } = await setup();
    await type('   '); expect(button('Agregar campo').disabled).toBe(true);
    await type('a'.repeat(201)); expect(button('Agregar campo').disabled).toBe(true);
    await click('Agregar campo');
    expect(api.updateValidationConfiguration).not.toHaveBeenCalled();
  });
});
