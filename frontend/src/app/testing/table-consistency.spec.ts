import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { vi } from 'vitest';
import { Catalog } from '../features/catalog/pages/catalog/catalog';
import { CatalogMetadata } from '../features/catalog/services/catalog-metadata';
import type { Term } from '../features/catalog/models/catalog-term';
import { ColumnMapping } from '../features/importer/components/column-mapping/column-mapping';

function heading(root: HTMLElement, name: string) {
  const button = root.querySelector<HTMLButtonElement>(`th button[aria-label="Ordenar por ${name}"]`);
  expect(button, name).toBeTruthy(); return button!;
}
describe('Tablas con controles compartidos', () => {
  const sync = vi.fn();
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideTanStackQuery(new QueryClient()), { provide: CatalogMetadata, useValue: { syncCatalog: sync } },
  ] }));
  afterEach(() => { TestBed.resetTestingModule(); vi.clearAllMocks(); });
  it('ordena todo el catálogo antes de paginar, conserva filtros y no modifica metadatos ni sincroniza', async () => {
    const terms: Term[] = Array.from({ length: 25 }, (_, i) => ({ name: String(25 - i).padStart(2, '0'), uri: `https://rs.tdwg.org/${i}`, definition: `Original ${i}`, category: '', status: 'current' }));
    const before = JSON.stringify(terms); terms.forEach(Object.freeze); Object.freeze(terms);
    const f = TestBed.createComponent(Catalog); f.componentRef.setInput('terms', terms); await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    heading(root, 'Término / enlace oficial').click(); await f.whenStable();
    expect(root.querySelector('tbody tr td strong')?.textContent).toBe('01');
    expect(root.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending');
    heading(root, 'Término / enlace oficial').click(); await f.whenStable();
    expect(root.querySelector('tbody tr td strong')?.textContent).toBe('25');
    const search = root.querySelector<HTMLInputElement>('input[type=search]')!;
    search.value = '01'; search.dispatchEvent(new Event('input', { bubbles: true })); await f.whenStable();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(root.querySelector('tbody strong')?.textContent).toBe('01');
    [...root.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Restablecer filtros')!.click(); await f.whenStable();
    expect(root.querySelectorAll('tbody tr')).toHaveLength(15);
    expect(JSON.stringify(terms)).toBe(before); expect(sync).not.toHaveBeenCalled();
  });
  it('quita la prosa repetida del catálogo sin ocultar el origen oficial ni el buscador elegido', async () => {
    const f = TestBed.createComponent(Catalog); f.componentRef.setInput('terms', []); await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('.section-heading p:not([hidden])')).toBeNull();
    const feedback = root.querySelector<HTMLElement>('#catalog-sync-status')!;
    expect(feedback.hidden).toBe(true);
    expect(getComputedStyle(feedback).display).toBe('none');
    expect(root.textContent).toContain('TDWG');
    expect(root.textContent).toContain('Buscar en todos los atributos');
  });
  it('conserva el agrupado inicial del mapeo y permite ordenar todas las columnas sin cambiar datos ni destinos', async () => {
    const f = TestBed.createComponent(ColumnMapping);
    const mapped = vi.fn(); f.componentInstance.mapped.subscribe(mapped);
    const headers = ['z', 'b', 'a', 'c']; const rows = [{ row: 2, values: ['z', '', 'a', ''] }];
    const mapping = { z: 'zz', a: 'aa', b: '00' }; const before = JSON.stringify({ headers, rows, mapping });
    f.componentRef.setInput('headers', headers); f.componentRef.setInput('rows', rows);
    f.componentRef.setInput('mapping', mapping); f.componentRef.setInput('terms', []); await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    const displayed = () => [...root.querySelectorAll('th[scope=row]')].map(h => h.textContent?.trim());
    expect(displayed()).toEqual(['z', 'a', 'b', 'c']);
    heading(root, 'Encabezado de origen').click(); await f.whenStable();
    expect(displayed()).toEqual(['a', 'b', 'c', 'z']);
    expect(root.querySelector('.mapping-empty-divider')).toBeNull();
    heading(root, 'Campo Darwin Core de destino').click(); await f.whenStable();
    expect(displayed()).toEqual(['b', 'a', 'z', 'c']);
    expect(JSON.stringify({ headers, rows, mapping })).toBe(before);
    expect(mapped).not.toHaveBeenCalled();
  });
});
