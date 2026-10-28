import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { Dataset } from '../../models/dataset';
import { ColumnMapping } from './column-mapping';

describe('Agrupación de columnas de origen', () => {
  let fixture: ComponentFixture<ColumnMapping>;
  let root: HTMLElement;
  const terms = [{ name: 'eventDate', uri: '', definition: '', category: '', status: 'recommended' }];
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: false, media, addEventListener() {}, removeEventListener() {},
    }));
    fixture = TestBed.createComponent(ColumnMapping);
    root = fixture.nativeElement;
    fixture.componentRef.setInput('terms', terms);
    fixture.componentRef.setInput('mapping', {});
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

  const headers = () => Array.from(root.querySelectorAll('.source-header strong'), el => el.textContent);
  const divider = () => root.querySelector('tbody tr.mapping-empty-divider');
  async function render(source: string[], rows?: Dataset['rows']) {
    fixture.componentRef.setInput('headers', source);
    if (rows !== undefined) fixture.componentRef.setInput('rows', rows);
    await fixture.whenStable();
  }

  it('ordena estable por contenido usando el índice original, sin normalizar NULL/N/A ni mutar datos', async () => {
    const source = ['Vacía', 'NULL literal', 'Espacios', 'N/A literal', 'Dato tardío', 'Cero'];
    const rows = [
      { row: 2, values: ['', 'NULL', ' \t\n', 'N/A', '', '0'] },
      { row: 8, values: ['', '', '\u00a0', '', ' dato ', ''] },
    ];
    const original = JSON.stringify({ source, rows });
    await render(source, rows);
    expect(headers()).toEqual(['NULL literal', 'N/A literal', 'Dato tardío', 'Cero', 'Vacía', 'Espacios']);
    expect(root.querySelectorAll('table')).toHaveLength(1);
    expect(root.querySelector('.mapping-summary')?.textContent).toContain('4 campos con datos · 2 campos sin datos');
    expect(divider()?.textContent).toContain('Campos sin datos');
    expect(divider()?.nextElementSibling?.querySelector('strong')?.textContent).toBe('Vacía');
    expect(JSON.stringify({ source, rows })).toBe(original);
  });

  it('repite el separador al empezar una página dentro de los campos sin datos y conserva 12 filas', async () => {
    const source = Array.from({ length: 27 }, (_, i) => `Columna ${i}`);
    await render(source, [{ row: 2, values: source.map((_, i) => i < 2 ? 'dato' : '') }]);
    expect(headers()).toHaveLength(12);
    expect(divider()?.nextElementSibling?.querySelector('strong')?.textContent).toBe('Columna 2');
    const next = root.querySelector<HTMLButtonElement>('.p-paginator-next')!;
    next.click();
    await fixture.whenStable();
    expect(headers()).toEqual(source.slice(12, 24));
    expect(root.querySelector('tbody')?.firstElementChild).toBe(divider());
    expect(divider()?.textContent).toContain('Campos sin datos');
    next.click();
    await fixture.whenStable();
    expect(headers()).toEqual(source.slice(24));
    expect(root.querySelector('tbody')?.firstElementChild).toBe(divider());
  });

  it('distingue todos vacíos y actualiza la agrupación al recibir filas con contenido', async () => {
    await render(['Primera', 'Segunda'], [{ row: 2, values: ['', '  '] }]);
    expect(headers()).toEqual(['Primera', 'Segunda']);
    expect(root.querySelector('tbody')?.firstElementChild).toBe(divider());
    expect(root.querySelector('.mapping-summary')?.textContent).toContain('0 campos con datos · 2 campos sin datos');
    fixture.componentRef.setInput('rows', [{ row: 2, values: ['', 'dato'] }]);
    await fixture.whenStable();
    expect(headers()).toEqual(['Segunda', 'Primera']);
    expect(divider()?.nextElementSibling?.querySelector('strong')?.textContent).toBe('Primera');
  });

  it('no añade un separador si todas las columnas tienen datos', async () => {
    await render(['Primera', 'Segunda'], [{ row: 2, values: ['a', 'b'] }]);
    expect(headers()).toEqual(['Primera', 'Segunda']);
    expect(divider()).toBeNull();
    expect(root.querySelector('.mapping-summary')?.textContent).toContain('2 campos con datos · 0 campos sin datos');
  });

  it('sin filas conserva el orden y no presenta las columnas como vacías', async () => {
    await render(['z', 'a']);
    expect(headers()).toEqual(['z', 'a']);
    expect(divider()).toBeNull();
    expect(root.querySelector('.mapping-summary')).toBeNull();
    fixture.componentRef.setInput('rows', []);
    await fixture.whenStable();
    expect(headers()).toEqual(['z', 'a']);
    expect(divider()).toBeNull();
    expect(root.querySelector('.mapping-summary')).toBeNull();
  });

  it('conserva destino, texto libre, limpieza y sugerencias vinculados al encabezado tras ordenar', async () => {
    fixture.componentRef.setInput('mapping', { eventDate: 'customField' });
    const mapped = vi.fn();
    fixture.componentInstance.mapped.subscribe(mapped);
    await render(['Vacía', 'eventDate'], [{ row: 2, values: ['', '2026-01-01'] }]);
    expect(headers()).toEqual(['eventDate', 'Vacía']);
    const row = root.querySelector('.source-header')!.closest('tr')!;
    const input = row.querySelector('input')!;
    expect(input.value).toBe('customField');
    input.value = ' arbitrary ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(mapped).toHaveBeenLastCalledWith({ header: 'eventDate', value: ' arbitrary ' });
    row.querySelector<HTMLButtonElement>('[aria-label="Limpiar Mapear eventDate"]')!.click();
    await fixture.whenStable();
    expect(mapped).toHaveBeenLastCalledWith({ header: 'eventDate', value: '' });
    const suggestion = row.querySelector<HTMLButtonElement>('.suggestion-chips button')!;
    expect(suggestion.textContent?.trim()).toBe('eventDate');
    suggestion.click();
    await fixture.whenStable();
    expect(mapped).toHaveBeenLastCalledWith({ header: 'eventDate', value: 'eventDate' });
    expect(root.querySelectorAll('app-dwc-picker')).toHaveLength(2);
  });
});
