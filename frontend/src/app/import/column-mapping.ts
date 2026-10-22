import { Component, input, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Term } from '../analysis/model';
import { suggestions } from '../analysis/validator';
import { DwcPicker } from '../shared/dwc-picker';

@Component({
  selector: 'app-column-mapping',
  imports: [TableModule, DwcPicker],
  template: `
    <p-table [value]="headers()" [paginator]="true" [rows]="12">
      <ng-template #header>
        <tr><th>Encabezado de origen</th><th>Campo Darwin Core de destino</th><th>Posible equivalencia</th></tr>
      </ng-template>
      <ng-template #body let-header>
        <tr>
          <th scope="row" class="source-header"><small>Origen</small><strong>{{ header }}</strong></th>
          <td>
            <app-dwc-picker [terms]="terms()" [label]="'Mapear ' + header"
              [value]="mapping()[header] || ''" (valueChange)="mapped.emit({ header, value: $event })" />
          </td>
          <td>
            <div class="suggestion-chips">
              @for (suggestion of suggest(header); track suggestion) {
                <button type="button" [attr.aria-pressed]="mapping()[header] === suggestion"
                  (click)="mapped.emit({ header, value: suggestion })">Usar {{ suggestion }}</button>
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
  readonly terms = input.required<Term[]>();
  readonly mapping = input.required<Record<string, string>>();
  readonly mapped = output<{ header: string; value: string }>();
  suggest(header: string) {
    return suggestions(header, this.terms());
  }
}
