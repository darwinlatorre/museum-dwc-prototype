import { Component, computed, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { Term } from './analysis/model';
@Component({
  selector: 'app-catalog',
  imports: [FormField, TableModule],
  template: `
    <div class="section-heading">
      <div>
        <h2>Darwin Core catalog</h2>
        <p>Official vocabulary, not a list of mandatory fields. Profiles define requirements.</p>
      </div>
      <span class="count">{{ terms().length }} terms</span>
    </div>
    <div class="toolbar">
      <label
        >Search every attribute<input
          type="search"
          [formField]="filters.search"
          placeholder="Name, definition, URI, category or status"
      /></label>
      <label
        >Category<select [formField]="filters.category">
          <option value="">All categories</option>
          @for (category of categories(); track category) {
            <option [value]="category">{{ category }}</option>
          }
        </select></label
      >
    </div>
    <p-table
      [value]="filtered()"
      [paginator]="true"
      [rows]="15"
      [rowsPerPageOptions]="[15, 30, 50]"
      [tableStyle]="{ 'min-width': '45rem' }"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="{first}–{last} of {totalRecords} terms"
    >
      <ng-template #header
        ><tr>
          <th>Term / URI</th>
          <th>Definition</th>
          <th>Category</th>
          <th>Status</th>
        </tr></ng-template
      >
      <ng-template #body let-term
        ><tr>
          <td>
            <strong>{{ term.name }}</strong
            ><a [href]="term.uri" target="_blank" rel="noopener noreferrer">{{ term.uri }}</a>
          </td>
          <td class="definition">{{ term.definition }}</td>
          <td>{{ term.category }}</td>
          <td>{{ term.status }}</td>
        </tr></ng-template
      >
      <ng-template #emptymessage
        ><tr>
          <td colspan="4">No terms match these filters.</td>
        </tr></ng-template
      ></p-table
    >
  `,
})
export class Catalog {
  terms = input.required<Term[]>();
  model = signal({ search: '', category: '' });
  filters = form(this.model);
  categories = computed(() => [...new Set(this.terms().map((t) => t.category))].sort());
  filtered = computed(() =>
    this.terms().filter(
      (t) =>
        (!this.model().category || t.category === this.model().category) &&
        Object.values(t).join(' ').toLowerCase().includes(this.model().search.toLowerCase()),
    ),
  );
}
