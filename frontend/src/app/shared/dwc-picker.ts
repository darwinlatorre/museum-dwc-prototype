import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';
import { SelectModule } from 'primeng/select';
import { Term } from '../analysis/model';

/** PrimeNG/CVA boundary; consumers keep their existing signal form or mapping state. */
@Component({
  selector: 'app-dwc-picker',
  imports: [FormsModule, SelectModule],
  template: `
    <div class="dwc-picker">
      <p-select
        [options]="names()"
        [ngModel]="value()"
        (ngModelChange)="value.set($event ?? '')"
        [ngModelOptions]="{ standalone: true }"
        [disabled]="disabled()"
        [editable]="true"
        [filter]="true"
        [ariaLabel]="label()"
        [pt]="{ dropdown: { 'aria-label': 'Abrir ' + label() } }"
        filterPlaceholder="Buscar campo Darwin Core"
        ariaFilterLabel="Buscar campo Darwin Core"
        placeholder="Sin asignar"
        emptyFilterMessage="Ningún campo coincide"
        emptyMessage="No hay campos disponibles"
        [resetFilterOnHide]="true"
        appendTo="body"
      />
      <button type="button" [attr.aria-label]="'Limpiar ' + label()"
        [disabled]="disabled() || !value()" (click)="value.set('')">Limpiar</button>
    </div>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .dwc-picker { display: flex; align-items: start; gap: .5rem; }
    p-select { flex: 1; min-width: 0; width: 100%; }
  `,
})
export class DwcPicker implements FormValueControl<string> {
  readonly terms = input.required<Term[]>();
  readonly label = input('Campo Darwin Core');
  readonly value = model('');
  readonly disabled = input(false);
  readonly names = computed(() => this.terms().map((term) => term.name));
}
