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
      <div class="dwc-picker-field" #field>
        <p-select
          [options]="filteredNames()"
          [ngModel]="value()"
          (ngModelChange)="value.set($event ?? '')"
          [ngModelOptions]="{ standalone: true }"
          [disabled]="disabled()"
          [editable]="true"
          [filter]="false"
          [panelStyle]="{ width: field.getBoundingClientRect().width + 'px' }"
          panelStyleClass="dwc-picker-panel"
          [ariaLabel]="label()"
          [pt]="{ dropdown: { 'aria-label': 'Abrir ' + label() } }"
          placeholder="Sin asignar"
          [emptyMessage]="names().length ? 'Ningún campo coincide' : 'No hay campos disponibles'"
          appendTo="body"
        />
      </div>
      <button type="button" [attr.aria-label]="'Limpiar ' + label()"
        [disabled]="disabled() || !value()" (click)="value.set('')">Limpiar</button>
    </div>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .dwc-picker { display: flex; align-items: start; gap: .5rem; }
    .dwc-picker-field { flex: 1; min-width: 0; }
    p-select { width: 100%; }
  `,
})
export class DwcPicker implements FormValueControl<string> {
  readonly terms = input.required<Term[]>();
  readonly label = input('Campo Darwin Core');
  readonly value = model('');
  readonly disabled = input(false);
  readonly names = computed(() => this.terms().map((term) => term.name));
  readonly filteredNames = computed(() => {
    const value = this.value();
    const names = this.names();
    // Exact selections keep the full vocabulary available; typing filters in the same field.
    return names.includes(value)
      ? names
      : names.filter((name) => name.toLowerCase().includes(value.toLowerCase()));
  });
}
