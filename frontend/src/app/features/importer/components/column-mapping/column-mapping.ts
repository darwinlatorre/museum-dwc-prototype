import { Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import type { Term } from '../../../catalog/models/catalog-term';
import { suggestions } from '../../engine/validator';
import type { Dataset } from '../../models/dataset';
import { DwcPicker } from '../../../../shared/ui/dwc-picker/dwc-picker';

@Component({
  selector: 'app-column-mapping',
  imports: [TableModule, DwcPicker],
  templateUrl: './column-mapping.html',
})
export class ColumnMapping {
  readonly headers = input.required<string[]>();
  readonly rows = input<Dataset['rows']>([]);
  // Classify against source indices before partitioning; never reorder the dataset itself.
  readonly columns = computed(() => {
    const rows = this.rows();
    const columns = this.headers().map((header, index) => ({
      header,
      hasData: rows.some(row => !!row.values[index]?.trim()),
    }));
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
