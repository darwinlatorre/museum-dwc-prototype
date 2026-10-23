import { Component, computed, inject, input, signal } from '@angular/core';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { Api } from './api';
import { form, FormField } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { Term } from './analysis/model';
@Component({
  selector: 'app-catalog',
  imports: [FormField, TableModule],
  template: `
    <div class="section-heading">
      <div>
        <h2>Catálogo Darwin Core</h2>
        <p>
          Vocabulario oficial, no una lista de campos obligatorios. Los perfiles definen los
          requisitos. Las definiciones, categorías y estados se conservan en el idioma de la fuente
          oficial TDWG (inglés).
        </p>
      </div>
      <span class="count">{{ terms().length }} términos</span>
    </div>
    <div class="toolbar">
      <button type="button" [disabled]="sync.isPending()" [attr.aria-busy]="sync.isPending()"
        (click)="synchronize()">{{ sync.isPending() ? 'Sincronizando…' : 'Sincronizar con TDWG' }}</button>
      @if (notice()) {
        <p role="status" aria-live="polite" [class.error]="sync.isError() || sync.data()?.outcome === 'FAILED'">{{ notice() }}</p>
      }
    </div>
    <div class="toolbar">
      <label
        >Buscar en todos los atributos<input
          type="search"
          [formField]="filters.search"
          placeholder="Nombre, definición, URI, categoría o estado"
      /></label>
      <label
        >Categoría<select [formField]="filters.category">
          <option value="">Todas las categorías</option>
          @for (category of categories(); track category) {
            <option [value]="category">{{ categoryLabel(category) }}</option>
          }
        </select></label
      >
      <label>Estado<select [formField]="filters.status">
        <option value="">Todos los estados</option>
        @for (status of statuses(); track status) {
          <option [value]="status">{{ status }}</option>
        }
      </select></label>
      <button type="button" (click)="reset()">Restablecer filtros</button>
    </div>
    <p-table
      [value]="filtered()"
      [paginator]="true"
      [rows]="15"
      [rowsPerPageOptions]="[15, 30, 50]"
      [tableStyle]="{ 'min-width': '45rem' }"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="{first}–{last} de {totalRecords} términos"
    >
      <ng-template #header
        ><tr>
          <th>Término / URI</th>
          <th>Definición (original en inglés)</th>
          <th>Categoría (fuente)</th>
          <th>Estado (fuente)</th>
        </tr></ng-template
      >
      <ng-template #body let-term
        ><tr>
          <td>
            <strong>{{ term.name }}</strong
            ><a [href]="term.uri" target="_blank" rel="noopener noreferrer">{{ term.uri }}</a>
          </td>
          <td class="definition" lang="en">{{ term.definition }}</td>
          <td>{{ categoryLabel(term.category) }}</td>
          <td>{{ term.status }}</td>
        </tr></ng-template
      >
      <ng-template #emptymessage
        ><tr>
          <td colspan="4">Ningún término coincide con estos filtros.</td>
        </tr></ng-template
      ></p-table
    >
  `,
})
export class Catalog {
  terms = input.required<Term[]>();
  private readonly api = inject(Api);
  private readonly client = injectQueryClient();
  readonly sync = injectMutation(() => ({
    mutationFn: () => this.api.syncCatalog(),
    retry: false,
    onSettled: () => this.client.invalidateQueries({ queryKey: ['catalog'] }),
  }));
  readonly notice = computed(() => {
    if (this.sync.isError()) return 'No se pudo confirmar la sincronización. Consulte el estado del catálogo antes de reintentar.';
    switch (this.sync.data()?.outcome) {
      case 'SUCCESS': return 'Catálogo sincronizado con TDWG.';
      case 'FAILED': return 'No se pudo sincronizar. Se conserva la última versión válida.';
      case 'SUPERSEDED': return 'Otra sincronización reemplazó este intento; se conserva el estado más reciente.';
      default: return '';
    }
  });
  synchronize() {
    if (!this.sync.isPending()) this.sync.mutate();
  }
  model = signal({ search: '', category: '', status: '' });
  filters = form(this.model);
  // The sentinel is presentation-only: an absent category is never written to metadata.
  readonly absentCategory = '__absent_category__';
  categoryLabel(category: string) {
    if (!category || category === this.absentCategory) return 'Sin categoría';
    return category.split(/[/#]/).filter(Boolean).at(-1) || category;
  }
  reset() {
    this.model.set({ search: '', category: '', status: '' });
  }
  categories = computed(() => [...new Set(this.terms().map((t) => t.category || this.absentCategory))].sort());
  statuses = computed(() => [...new Set(this.terms().map((t) => t.status))].sort());
  filtered = computed(() =>
    this.terms().filter(
      (t) =>
        (!this.model().category || (t.category || this.absentCategory) === this.model().category) &&
        (!this.model().status || t.status === this.model().status) &&
        Object.values(t).join(' ').toLowerCase().includes(this.model().search.toLowerCase()),
    ),
  );
}
