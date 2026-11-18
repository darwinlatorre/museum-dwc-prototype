import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TableHeader } from './table-header';
import type { TableSortDirection } from '../../lib/table-sort';

@Component({
  imports: [TableHeader],
  template: `<table><thead><tr><th museumSortHeader label="occurrenceID"
    [direction]="direction()" [disabled]="disabled()" (sortRequested)="sort()"></th></tr></thead></table>
    <output>{{ count() }}</output><button (click)="disabled.set(true)">Bloquear</button>`,
})
class HeaderHost {
  readonly direction = signal<TableSortDirection | null>(null);
  readonly disabled = signal(false);
  readonly count = signal(0);
  sort() {
    this.count.update(value => value + 1);
    this.direction.update(value => value === 'asc' ? 'desc' : 'asc');
  }
}

describe('Cabecera reutilizable de tabla', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('expone columna y estado de orden sin instrucciones visibles repetidas', async () => {
    const fixture = TestBed.createComponent(HeaderHost); await fixture.whenStable();
    const heading = fixture.nativeElement.querySelector('th') as HTMLTableCellElement;
    const button = heading.querySelector('button')!;
    expect(heading.getAttribute('aria-sort')).toBe('none');
    expect(button.getAttribute('aria-label')).toBe('Ordenar por occurrenceID');
    expect(button.textContent?.trim()).toBe('occurrenceID');
  });
  it('emite una sola petición por activación y refleja el orden controlado por su dueño', async () => {
    const fixture = TestBed.createComponent(HeaderHost); await fixture.whenStable();
    const heading = fixture.nativeElement.querySelector('th') as HTMLTableCellElement;
    const button = heading.querySelector('button')!;
    button.click(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('output').textContent).toBe('1');
    expect(heading.getAttribute('aria-sort')).toBe('ascending');
    button.click(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('output').textContent).toBe('2');
    expect(heading.getAttribute('aria-sort')).toBe('descending');
  });
  it('respeta la deshabilitación nativa sin emitir operaciones', async () => {
    const fixture = TestBed.createComponent(HeaderHost); await fixture.whenStable();
    (fixture.nativeElement.querySelector(':scope > button') as HTMLButtonElement).click();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('th button') as HTMLButtonElement;
    expect(button.disabled).toBe(true); button.click(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('output').textContent).toBe('0');
  });
});
