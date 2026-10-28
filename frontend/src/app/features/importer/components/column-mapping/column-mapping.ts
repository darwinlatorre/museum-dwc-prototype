import { Component, computed, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import type { Term } from '../../../catalog/models/catalog-term';
import { suggestions } from '../../engine/validator';
import type { Dataset } from '../../models/dataset';
import { DwcPicker } from '../../../../shared/ui/dwc-picker/dwc-picker';

@Component({
  selector: 'app-column-mapping',
  imports: [TableModule, DwcPicker],
  template: `
    @if (rows().length) {
      <p class="mapping-summary">{{ populatedCount() }} campos con datos · {{ headers().length - populatedCount() }} campos sin datos</p>
    }
    <p-table #table class="mapping-table" [value]="columns()" [paginator]="true" [rows]="12" [rowsPerPageOptions]="[12, 25, 50, 100]" [showCurrentPageReport]="true" currentPageReportTemplate="{first}–{last} de {totalRecords} columnas">
      <ng-template #header>
        <tr><th>Encabezado de origen</th><th>Campo Darwin Core de destino</th><th>Posible equivalencia</th></tr>
      </ng-template>
      <ng-template #body let-column let-rowIndex="rowIndex">
        @let header = column.header;
        @if (rows().length && !column.hasData && (rowIndex === populatedCount() || rowIndex === table.first)) {
          <tr class="mapping-empty-divider"><th colspan="3" scope="rowgroup">Campos sin datos</th></tr>
        }
        <tr>
          <th scope="row" class="source-header"><strong>{{ header }}</strong></th>
          <td>
            <app-dwc-picker [terms]="terms()" [label]="'Mapear ' + header"
              [value]="mapping()[header] || ''" (valueChange)="mapped.emit({ header, value: $event })" />
          </td>
          <td>
            <div class="suggestion-chips">
              @for (suggestion of suggest(header); track suggestion) {
                <button type="button" [attr.aria-pressed]="mapping()[header] === suggestion"
                  (click)="mapped.emit({ header, value: suggestion })">{{ suggestion }}</button>
              }
            </div>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
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
