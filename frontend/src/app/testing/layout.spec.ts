import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Profiles } from '../features/profiles/profiles';
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

  it('offers page sizes for mapping, profiles and catalog while preserving defaults', async () => {
    const mapping = TestBed.createComponent(ColumnMapping);
    mapping.componentRef.setInput('headers', ['a']);
    mapping.componentRef.setInput('terms', []);
    mapping.componentRef.setInput('mapping', {});
    const profiles = TestBed.createComponent(Profiles);
    profiles.componentRef.setInput('profiles', []);
    profiles.componentRef.setInput('terms', []);
    const catalog = TestBed.createComponent(Catalog);
    catalog.componentRef.setInput('terms', []);
    for (const [f, expected] of [[mapping, 12], [profiles, 10], [catalog, 15]] as const) {
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

  it('lays out the six rule fields in a dedicated three-column grid without moving removal', async () => {
    const f = TestBed.createComponent(Profiles);
    f.componentRef.setInput('profiles', []);
    f.componentRef.setInput('terms', []);
    f.componentInstance.create();
    f.componentInstance.addRule();
    await f.whenStable();
    const rule = document.querySelector('fieldset')!;
    const grid = rule.querySelector('.rule-grid');
    expect(grid?.children.length).toBe(6);
    expect(rule.querySelector('button')?.textContent).toContain('Limpiar');
    const remove = [...rule.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Eliminar regla')!;
    expect(remove.parentElement).toBe(rule);
    expect(f.componentInstance.model().rules[0]).toMatchObject({ field: '', kind: 'required', condition: 'always' });
  });

  it('places collection before permit without selecting it or changing the emitted keys', async () => {
    const f = TestBed.createComponent(RecordContext);
    const context = { collection: false, permit: false, sampling: false, marine: false };
    f.componentRef.setInput('context', context);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('label')?.textContent).toContain('Colección biológica.');
    expect([...root.querySelectorAll('input')].every(i => !i.checked)).toBe(true);
    const events: unknown[] = [];
    f.componentInstance.contextChanged.subscribe(value => events.push(value));
    root.querySelector('input')!.click();
    expect(events).toEqual([{ ...context, collection: true }]);
    expect(context.collection).toBe(false);
  });

  it('uses three flexible rule columns and stacks only at narrow widths', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.rule-grid[^{}]*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
    expect(css).toMatch(/\.rule-grid[^{}]*\{[^}]*grid-template-columns:\s*1fr/s);
  });

  it('keeps compact mapping suggestions in one horizontally scrollable strip', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.mapping-table[^{}]*\.suggestion-chips[^{}]*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.mapping-table[^{}]*\.dwc-picker[^{}]*>\s*button[^{}]*\{[^}]*width:\s*auto/s);
  });

  it('separates the sheet reading action from its selector', async () => {
    const f = TestBed.createComponent(LayoutStyles); await f.whenStable();
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    expect(css).toMatch(/\.sheet-read-action[^{}]*\{[^}]*margin-top:\s*1rem/s);
  });
});
