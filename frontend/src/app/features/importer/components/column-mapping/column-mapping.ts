import { Component, computed, input, output, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import type { Term } from '../../../catalog/models/catalog-term';
import { suggestions } from '../../engine/validator';
import type { Dataset } from '../../models/dataset';
import { DwcPicker } from '../../../../shared/ui/dwc-picker/dwc-picker';
import { TableHeader } from '../../../../shared/ui/table-header/table-header';
import { nextTableOrder, sortTableRows, type TableOrder } from '../../../../shared/lib/table-sort';
type MappingColumn = 'header' | 'target' | 'suggestion';

@Component({
  selector: 'app-column-mapping',
  imports: [TableModule, DwcPicker, TableHeader],
  templateUrl: './column-mapping.html',
})
export class ColumnMapping {
  readonly headers = input.required<string[]>();
  readonly order = signal<TableOrder<MappingColumn> | null>(null);
  readonly first = signal(0);
  sort(column: MappingColumn) {
    this.order.update(current => nextTableOrder(current, column)); this.first.set(0);
  }
  readonly rows = input<Dataset['rows']>([]);
  // Classify against source indices before partitioning; never reorder the dataset itself.
  readonly columns = computed(() => {
    const rows = this.rows();
    const columns = this.headers().map((header, index) => ({
      header,
      hasData: rows.some(row => !!row.values[index]?.trim()),
    }));
    const order = this.order();
    if (order) return sortTableRows(columns, column => order.column === 'header' ? column.header
      : order.column === 'target' ? this.mapping()[column.header] : this.suggest(column.header).join('\n'), order.direction);
    // Legacy standalone callers have no content evidence: retain their original order.
    return rows.length
      ? [...columns.filter(column => column.hasData), ...columns.filter(column => !column.hasData)]
      : columns;
  });
  readonly populatedCount = computed(() => this.columns().filter(column => column.hasData).length);
  readonly terms = input.required<Term[]>();
  readonly mapping = input.required<Record<string, string>>();
  readonly mapped = output<{ header: string; value: string }>();
  suggest(header: string) {
    return suggestions(header, this.terms());
  }
}
