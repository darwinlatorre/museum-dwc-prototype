import { Component, input, output } from '@angular/core';
import type { Context } from '../../models/context';

@Component({
  selector: 'app-record-context',
  template: `
    <fieldset>
      <legend>Contexto de los registros (obligatorio)</legend>
      <div class="context-grid">
        @for (option of options; track option.key) {
          <label><input type="radio" name="record-context" [value]="option.key" required
            [checked]="context() === option.key" (change)="contextChanged.emit(option.key)" />
            <strong>{{ option.label }}</strong></label>
        }
      </div>
    </fieldset>
  `,
})
export class RecordContext {
  readonly context = input<Context | undefined>(undefined);
  readonly contextChanged = output<Context>();
  readonly options: { key: Context; label: string }[] = [
    { key: 'collection', label: 'Colección biológica.' },
    { key: 'permit', label: 'Asociados a un permiso de recolección o acceso a recursos genéticos.' },
    { key: 'sampling', label: 'Eventos de muestreo.' },
    { key: 'marine', label: 'Marinos.' },
    { key: 'other', label: 'Otros: observaciones en campo, registros fortuitos u otros orígenes no contemplados.' },
  ];
}
