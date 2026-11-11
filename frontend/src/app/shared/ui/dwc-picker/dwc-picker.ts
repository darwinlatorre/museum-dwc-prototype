import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';
import { SelectModule } from 'primeng/select';
import type { Term } from '../../../features/catalog/models/catalog-term';

/** PrimeNG/CVA boundary; consumers keep their existing signal form or mapping state. */
@Component({
  selector: 'app-dwc-picker',
  imports: [FormsModule, SelectModule],
  templateUrl: './dwc-picker.html',
  styleUrl: './dwc-picker.scss',
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
