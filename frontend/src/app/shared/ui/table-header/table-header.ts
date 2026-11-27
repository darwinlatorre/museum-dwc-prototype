import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { TableSortDirection } from '../../lib/table-sort';

@Component({
  selector: 'th[museumSortHeader]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'museum-sort-heading',
    '[attr.aria-sort]': "direction() === 'asc' ? 'ascending' : direction() === 'desc' ? 'descending' : 'none'",
  },
  templateUrl: './table-header.html',
})
export class TableHeader {
  readonly label = input.required<string>();
  readonly direction = input<TableSortDirection | null>(null);
  readonly disabled = input(false);
  readonly sortRequested = output<void>();
}
