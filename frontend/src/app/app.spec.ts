import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { App } from './app';
import { Api } from './api';

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
  });
});
