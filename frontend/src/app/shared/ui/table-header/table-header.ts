import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { TableSortDirection } from '../../lib/table-sort';

@Component({
  selector: 'th[museumSortHeader]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'museum-sort-heading',
    '[attr.aria-sort]': "direction() === 'asc' ? 'ascending' : direction() === 'desc' ? 'descending' : 'none'",
  },
  template: `<button type="button" [disabled]="disabled()" [attr.aria-label]="'Ordenar por ' + label()"
    [title]="'Ordenar por ' + label()" (click)="sortRequested.emit()">
    <span>{{ label() }}</span>
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="m8 9 4-4 4 4" [attr.opacity]="direction() === 'desc' ? 0.25 : 1" />
      <path d="m8 15 4 4 4-4" [attr.opacity]="direction() === 'asc' ? 0.25 : 1" />
    </svg>
  </button>`,
})
export class TableHeader {
  readonly label = input.required<string>();
  readonly direction = input<TableSortDirection | null>(null);
  readonly disabled = input(false);
  readonly sortRequested = output<void>();
}
