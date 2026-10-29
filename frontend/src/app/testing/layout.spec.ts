import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ValidationConfigurationEditor } from '../features/record-sources/validation-configuration';
import { configurationFixture } from './validation-fixture';
import { RecordContext } from '../features/importer/components/record-context/record-context';
import { Api } from '../core/api/api';
import { ColumnMapping } from '../features/importer/components/column-mapping/column-mapping';
import { Catalog } from '../features/catalog/catalog';
import { Table } from 'primeng/table';
import { By } from '@angular/platform-browser';

@Component({ template: '', styleUrl: '../../styles.scss' })
class LayoutStyles {}

describe('Compact collection layouts', () => {
  it('separates source rows without repeating an origin caption', async () => {
    const f = TestBed.createComponent(ColumnMapping);
    f.componentRef.setInput('headers', ['catalogNumber', 'eventDate']);
    f.componentRef.setInput('terms', []);
    f.componentRef.setInput('mapping', {});
    await f.whenStable();
    const headers = [...(f.nativeElement as HTMLElement).querySelectorAll('th[scope=row]')];
    expect(headers.map(h => h.textContent?.trim())).toEqual(['catalogNumber', 'eventDate']);
    expect(headers.every(h => !h.querySelector('small'))).toBe(true);
    const styles = TestBed.createComponent(LayoutStyles); await styles.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).not.toMatch(/mapping-table[^{}]*nth-child\((even|odd)\)/s);
    expect(css).toMatch(/mapping-table[^{}]*source-header[^{}]*\{[^}]*border-bottom:\s*1px solid/s);
    expect(css).toMatch(/\.p-datatable[^{}]*\.source-header[^{}]*\{[^}]*border-left:\s*1px solid/s);
    expect(css).toMatch(/mapping-table[^{}]*focus-within[^{}]*\{[^}]*background:\s*#e2eee6/s);
  });

  it('fills selected mapping suggestions without an inset border, including hover', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/suggestion-chips[^{}]*aria-pressed[^{}]*:hover[^{}]*\{[^}]*background:\s*var\(--pine\)/s);
    expect(css).toMatch(/suggestion-chips[^{}]*aria-pressed[^{}]*\{[^}]*box-shadow:\s*none/s);
  });

  it('removes amber textbox outlines while retaining green focus cues', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).not.toContain('#b07918');
    expect(css).toMatch(/input[^{}]*:focus[^{}]*\{[^}]*outline:\s*none/s);
    expect(css).toMatch(/button[^{}]*:focus-visible[^{}]*\{[^}]*outline:\s*2px solid var\(--pine\)/s);
  });

  it('shares selector height, border and focus tokens across native and PrimeNG controls', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toContain('--select-control-height:');
    expect(css).toMatch(/select[^{}]*\.p-select[^{}]*\{[^}]*min-height:\s*var\(--select-control-height\)/s);
    expect(css).toMatch(/\.p-select[^{}]*focus-within[^{}]*\{[^}]*border-color:/s);
    expect(css).toMatch(/select[^{}]*\.p-select[^{}]*\{[^}]*font-size:\s*1rem/s);
  });

  it('keeps the synchronization button at one fixed height without wrapping its label', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.catalog-sync-button[^{}]*\{[^}]*;\s*height:\s*var\(--select-control-height\)/s);
    expect(css).toMatch(/\.catalog-sync-button[^{}]*\{[^}]*white-space:\s*nowrap/s);
  });

  it('offers page sizes for mapping and catalog while preserving defaults', async () => {
    const mapping = TestBed.createComponent(ColumnMapping);
    mapping.componentRef.setInput('headers', ['a']);
    mapping.componentRef.setInput('terms', []);
    mapping.componentRef.setInput('mapping', {});
    const catalog = TestBed.createComponent(Catalog);
    catalog.componentRef.setInput('terms', []);
    for (const [f, expected] of [[mapping, 12], [catalog, 15]] as const) {
      await f.whenStable();
      const table = f.debugElement.query(By.directive(Table)).componentInstance as Table;
      expect(table.rows).toBe(expected);
      expect(table.rowsPerPageOptions).toEqual(expect.arrayContaining([expected, 50]));
    }
  });

  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideTanStackQuery(new QueryClient()), { provide: Api, useValue: {} },
  ] }));
  afterEach(() => TestBed.resetTestingModule());

  it('agrupa el contexto y selector compartido sin editor de reglas legado', async () => {
    const f = TestBed.createComponent(ValidationConfigurationEditor);
    f.componentRef.setInput('configuration', configurationFixture(['eventDate']));
    f.componentRef.setInput('terms', []);
    await f.whenStable();
    expect(f.nativeElement.querySelector('app-dwc-picker')).toBeTruthy();
    expect(f.nativeElement.querySelector('.rule-grid')).toBeNull();
    expect(f.nativeElement.textContent).toContain('eventDate');
  });

  it('places collection before permit without selecting it or changing the emitted keys', async () => {
    const f = TestBed.createComponent(RecordContext);
    const context = undefined;
    f.componentRef.setInput('context', context);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('label')?.textContent).toContain('Colección biológica.');
    expect([...root.querySelectorAll('input')].every(i => !i.checked)).toBe(true);
    const events: unknown[] = [];
    f.componentInstance.contextChanged.subscribe(value => events.push(value));
    root.querySelector('input')!.click();
    expect(events).toEqual(['collection']);
    expect(context).toBeUndefined();
  });

  it('mantiene radios nativos compactos y verdes sin heredar geometría de entradas de texto', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    const rule = css.match(/\.context-grid[^{}]*input\[type=["']?radio["']?\][^{}]*\{([^}]*)\}/s)?.[1];
    expect(rule).toBeTruthy();
    expect(rule).toMatch(/width:\s*18px/);
    expect(rule).toMatch(/height:\s*18px/);
    expect(rule).toMatch(/min-height:\s*18px/);
    expect(rule).toMatch(/padding:\s*0/);
    expect(rule).toMatch(/flex:\s*0 0 18px/);
    expect(rule).toMatch(/accent-color:\s*var\(--pine\)/);
    expect(css).toMatch(/\.context-grid[^{}]*input\[type=["']?radio["']?\][^{}]*:focus-visible[^{}]*\{[^}]*outline:\s*2px solid var\(--pine\)/s);
  });

  it('conserva la especialización móvil del contexto', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.context-grid[^{}]*\{[^}]*grid-template-columns:\s*1fr/s);
  });

  it('keeps compact mapping suggestions in one horizontally scrollable strip', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.mapping-table[^{}]*\.suggestion-chips[^{}]*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.mapping-table[^{}]*\.dwc-picker[^{}]*>\s*button[^{}]*\{[^}]*width:\s*auto/s);
  });

  it('styles native disclosure and compact diagnosis using existing tokens', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.workbench-help[^{}]*\{[^}]*margin[^}]*var\(--museum-space-/s);
    expect(css).toMatch(/summary[^{}]*:focus-visible[^{}]*\{[^}]*outline:\s*2px solid var\(--pine\)/s);
    expect(css).toMatch(/\.missing-source[^{}]*\{[^}]*overflow-wrap:\s*anywhere/s);
  });

  it('contiene la hoja, fija encabezados y fila física y distingue cambios sin crear otra paleta', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n')
      .replace(/\[_ng(?:content|host)-[^\]]+\]/g, '');
    expect(css).toMatch(/\.normalization-scroll[^{}]*\{[^}]*max-width:\s*100%[^}]*overflow:\s*auto/s);
    expect(css).toMatch(/\.normalization-grid[^{}]*thead\s+th[^{}]*\{[^}]*position:\s*sticky[^}]*top:\s*0/s);
    expect(css).toMatch(/\.normalization-grid[^{}]*th:first-child[^{}]*\{[^}]*position:\s*sticky[^}]*left:\s*0/s);
    expect(css).toMatch(/\.normalization-changed[^{}]*\{[^}]*border-left:[^}]*var\(--pine\)[^}]*background:[^}]*var\(--museum-/s);
    expect(css).toMatch(/\.normalization-sheet[^{}]*label[^{}]*\{[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/input\[role=["']?switch["']?\][^{}]*\{[^}]*appearance:\s*none[^}]*width:\s*44px[^}]*height:\s*24px/s);
    expect(css).toMatch(/input\[role=["']?switch["']?\]::before[^{}]*\{[^}]*width:\s*16px[^}]*height:\s*16px/s);
    expect(css).toMatch(/input\[role=["']?switch["']?\]:checked::before[^{}]*\{[^}]*transform:\s*translateX\(20px\)/s);
    expect(css).toMatch(/\.normalization-original[^{}]*\{[^}]*width:\s*min\(36rem,\s*(?:calc\(100vw\s*-\s*2rem\)|100vw\s*-\s*2rem)\)/s);
  });

  it('separates the sheet reading action from its selector', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.sheet-read-action[^{}]*\{[^}]*margin-top:\s*1rem/s);
  });
});
