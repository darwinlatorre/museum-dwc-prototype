import { Component, computed, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import type { Normalization, NormalizationKind } from '../../models/normalization';
import type { PreviewCell } from '../../models/normalization-preview';
import type { NormalizationPreviewState } from '../../pages/import-workbench/normalization-preview-state';

let nextPanel = 0;
@Component({
  selector: 'app-normalization-preview',
  templateUrl: './normalization-preview.html',
  host: { '(document:keydown.escape)': 'escape($event)' },
})
export class NormalizationPreview {
  readonly state = input.required<NormalizationPreviewState>();
  readonly options = input.required<Normalization>();
  readonly active = input(true);
  readonly optionsChanged = output<Pick<Normalization, 'dateOrder' | 'decimalMode'>>();
  readonly Math = Math;
  chunks(length: number) { return Array.from({ length: Math.ceil(length / 100) }, (_, i) => i * 100); }
  readonly panelId = `normalization-original-${++nextPanel}`;
  readonly detail = signal<{ cell: PreviewCell; row: number } | undefined>(undefined);
  readonly focusKey = signal('');
  readonly groupPage = signal(0);
  readonly rules = [
    { key: 'trim', label: 'Eliminar espacios al inicio y al final' },
    { key: 'emptyMarkers', label: 'Tratar NULL y N/A como vacíos (sin distinguir mayúsculas)' },
    { key: 'dates', label: 'Fechas Darwin Core' },
    { key: 'coordinates', label: 'Coordenadas decimales' },
    { key: 'numbers', label: 'Valores numéricos Darwin Core' },
    { key: 'duplicates', label: 'Comprobar duplicados' },
  ] as const;
  readonly ruleNames: Record<NormalizationKind, string> = {
    trim: 'Espacios exteriores', 'empty-marker': 'Marcador vacío', date: 'Fecha', coordinate: 'Coordenada', number: 'Número',
  };
  readonly duplicateGroups = computed(() => {
    const duplicates = this.state().metadata()?.duplicates;
    return [
      ...(duplicates?.equalRows.groups ?? []).map(group => ({ ...group, criterion: 'Fila completa igual' })),
      ...(duplicates?.occurrenceIds.groups ?? []).map(group => ({ ...group, criterion: 'occurrenceID repetido' })),
    ];
  });
  readonly viewName = computed(() => this.state().window().rowFilter === 'changed' ? 'Con cambios' : 'Todos');
  readonly range = computed(() => {
    const state = this.state();
    const total = state.viewTotal();
    const { offset, limit } = state.window();
    return `${total ? offset + 1 : 0}–${Math.min(offset + limit, total)} de ${total}`;
  });
  private readonly allButton = viewChild<ElementRef<HTMLButtonElement>>('allButton');
  private readonly originalRegion = viewChild<ElementRef<HTMLElement>>('originalRegion');
  private opener?: HTMLButtonElement;
  private suppressed?: HTMLButtonElement;
  constructor() {
    effect(() => {
      this.state().revision();
      this.active();
      this.detail.set(undefined);
      this.focusKey.set('');
      this.groupPage.set(0);
      this.opener = undefined;
      this.suppressed = undefined;
    });
  }
  showAll() {
    this.state().setRowFilter('all');
    this.allButton()?.nativeElement.focus({ preventScroll: true });
  }
  dateOrder(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'safe' || value === 'DMY' || value === 'MDY') this.optionsChanged.emit({ dateOrder: value, decimalMode: this.options().decimalMode });
  }
  decimalMode(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'safe' || value === 'comma') this.optionsChanged.emit({ dateOrder: this.options().dateOrder, decimalMode: value });
  }
  pageSize(event: Event) {
    const limit = Number((event.target as HTMLSelectElement).value);
    if (limit === 10 || limit === 25 || limit === 50 || limit === 100) this.state().page({ offset: 0, limit });
  }
  hide(event: Event) { this.state().setHideEmpty((event.target as HTMLInputElement).checked); }
  visible(value: string) {
    return value === '' ? '∅' : value.replace(/ /g, '␠').replace(/\t/g, '⇥').replace(/\r\n|\r|\n/g, '↵');
  }
  key(row: number, column: number) { return `${row}:${column}`; }
  tabIndex(row: number, column: number) {
    const first = this.state().rows()[0];
    return this.focusKey() ? (this.focusKey() === this.key(row, column) ? 0 : -1)
      : first?.sourceRow === row && first.cells[0]?.columnIndex === column ? 0 : -1;
  }
  open(cell: PreviewCell, row: number, event: Event, activate = false) {
    const target = event.currentTarget as HTMLButtonElement;
    if (!this.active() || !cell.kinds.length || !this.state().ready() || (!activate && this.suppressed === target)) return;
    this.opener = target;
    this.suppressed = undefined;
    this.detail.set({ cell, row });
  }
  release(event: Event) {
    if (this.suppressed === event.currentTarget) this.suppressed = undefined;
  }
  escape(event: KeyboardEvent) {
    const region = this.originalRegion()?.nativeElement;
    if (!this.active() || !this.detail() || !region) return;
    const target = event.target;
    // Hover can open the original while focus stays outside this component.
    const restore = target === this.opener || (target instanceof Node && region.contains(target));
    this.close(restore);
  }
  close(restore: boolean) {
    const opener = this.opener;
    this.detail.set(undefined);
    this.suppressed = opener;
    if (restore) opener?.focus({ preventScroll: true });
  }
  navigate(event: KeyboardEvent, row: number, column: number) {
    const delta = ({ ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] } as Record<string, number[]>)[event.key];
    if (!delta) return;
    event.preventDefault();
    const rows = this.state().rows();
    const r = rows.findIndex(item => item.sourceRow === row);
    const c = rows[r].cells.findIndex(cell => cell.columnIndex === column);
    const targetRow = rows[Math.max(0, Math.min(rows.length - 1, r + delta[0]))];
    const cell = targetRow.cells[Math.max(0, Math.min(targetRow.cells.length - 1, c + delta[1]))];
    const key = this.key(targetRow.sourceRow, cell.columnIndex);
    this.focusKey.set(key);
    const table = (event.currentTarget as HTMLElement).closest('table');
    table?.querySelector<HTMLButtonElement>(`button[data-cell="${key}"]`)?.focus();
  }
}
