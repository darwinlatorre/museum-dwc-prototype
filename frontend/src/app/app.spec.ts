import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { App } from './app';
import { Api } from './api';
import { Component } from '@angular/core';

// Compile the actual stylesheet: jsdom cannot provide browser geometry.
@Component({ template: '', styleUrl: '../styles.scss' })
class MappingStyleContract {}

describe('Collection workspace', () => {
  beforeEach(async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // This shell test starts with loaded metadata; no timer race with Query notifications.
    client.setQueryData(['catalog'], []);
    client.setQueryData(['profiles'], []);
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [App],
      providers: [
        provideTanStackQuery(client),
        { provide: Api, useValue: { catalog: async () => [], profiles: async () => [] } },
      ],
    });
    await TestBed.compileComponents();
  });

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
