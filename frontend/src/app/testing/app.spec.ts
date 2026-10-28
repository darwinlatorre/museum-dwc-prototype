import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { App } from '../app';
import { Api } from '../core/api/api';
import { Component } from '@angular/core';
import { vi } from 'vitest';
import { configurationFixture } from './validation-fixture';

// Compile the actual stylesheet: jsdom cannot provide browser geometry.
@Component({ template: '', styleUrl: '../../styles.scss' })
class MappingStyleContract {}

describe('Collection workspace', () => {
  beforeEach(async () => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // This shell test starts with loaded metadata; no timer race with Query notifications.
    client.setQueryData(['catalog'], []);
    client.setQueryData(['validation-configuration'], configurationFixture([]));
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [App],
      providers: [
        provideTanStackQuery(client),
        { provide: Api, useValue: { catalog: async () => [], validationConfiguration: async () => configurationFixture([]) } },
      ],
    });
    await TestBed.compileComponents();
  });

  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('reserva un marco de trabajo estable y controles de mapeo con un tamaño común', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const styleFixture = TestBed.createComponent(MappingStyleContract);
    await styleFixture.whenStable();
    const shell = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
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

  it('protege cambios globales sin guardar al navegar y cerrar la ventana', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const navigation = root.querySelectorAll<HTMLButtonElement>('nav button');
    navigation[1].click(); await fixture.whenStable();
    const blocks = await fixture.getDeferBlocks();
    await blocks.at(-1)!.render(DeferBlockState.Complete);
    await fixture.whenStable();
    const input = root.querySelector<HTMLInputElement>('app-dwc-picker input')!;
    input.value = 'local'; input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    [...root.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Agregar campo')!.click();
    await fixture.whenStable();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    navigation[2].click(); await fixture.whenStable();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(root.querySelector('app-validation-configuration')).toBeTruthy();
    expect(root.textContent).toContain('local');
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    confirm.mockReturnValue(true);
    navigation[2].click(); await fixture.whenStable();
    expect(root.querySelector('app-validation-configuration')).toBeNull();
    confirm.mockRestore();
  });

  it('shows accessible navigation and local import guidance', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const blocks = await fixture.getDeferBlocks();
    expect(blocks.length).toBeGreaterThan(0);
    await blocks[0].render(DeferBlockState.Complete);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('Calidad de los datos de colecciones');
    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Navegación principal');
    expect(root.textContent).toContain('El archivo permanece en este dispositivo');
    expect(root.querySelector('input[type=file]')?.getAttribute('accept')).toBe('.csv,.xlsx');
    const mounted = root.querySelector('app-import');
    const navigation = root.querySelectorAll<HTMLButtonElement>('nav button');
    navigation[1].click();
    await fixture.whenStable();
    expect(root.querySelector('app-import')).toBe(mounted);
    expect(mounted?.parentElement?.hidden).toBe(true);
    navigation[0].click();
    await fixture.whenStable();
    expect(root.querySelector('app-import')).toBe(mounted);
    expect(mounted?.parentElement?.hidden).toBe(false);
  });
});
