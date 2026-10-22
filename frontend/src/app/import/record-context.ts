import { Component, input, output } from '@angular/core';
import { Context } from '../analysis/model';

@Component({
  selector: 'app-record-context',
  template: `
    <div class="context-grid">
      @for (option of options; track option.key) {
        <label><input type="checkbox" [checked]="context()[option.key]"
          (change)="toggle(option.key, $event)" /><strong>{{ option.label }}</strong></label>
      }
      <label><input type="checkbox" [checked]="other()" (change)="otherChanged.emit(checked($event))" />
        <strong>Otros: observaciones en campo, registros fortuitos u otros orígenes no contemplados.</strong>
      </label>
    </div>
    <p>Los cuatro primeros contextos se pueden combinar. Otros significa ninguno de los anteriores;
      no agrega una regla de validación biológica.</p>
  `,
})
export class RecordContext {
  readonly context = input.required<Context>();
  readonly other = input(false);
  readonly contextChanged = output<Context>();
  readonly otherChanged = output<boolean>();
  readonly options: { key: keyof Context; label: string }[] = [
    { key: 'permit', label: 'Asociados a un permiso de recolección o acceso a recursos genéticos.' },
    { key: 'collection', label: 'Colección biológica.' },
    { key: 'sampling', label: 'Eventos de muestreo.' },
    { key: 'marine', label: 'Marinos.' },
  ];
  checked(event: Event) {
    return (event.target as HTMLInputElement).checked;
  }
  toggle(key: keyof Context, event: Event) {
    this.contextChanged.emit({ ...this.context(), [key]: this.checked(event) });
  }
}
