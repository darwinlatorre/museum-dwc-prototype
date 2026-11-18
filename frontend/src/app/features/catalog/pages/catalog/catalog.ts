import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { TableModule } from 'primeng/table';
import { CatalogMetadata } from '../../services/catalog-metadata';
import type { Term } from '../../models/catalog-term';
import { TableHeader } from '../../../../shared/ui/table-header/table-header';
import { nextTableOrder, sortTableRows, type TableOrder } from '../../../../shared/lib/table-sort';
type CatalogColumn = 'name' | 'definition' | 'category' | 'status';
@Component({
  selector: 'app-catalog',
  imports: [FormField, TableModule, TableHeader],
  templateUrl: './catalog.html',
})
export class Catalog {
  terms = input.required<Term[]>();
  private readonly api = inject(CatalogMetadata);
  private readonly client = inject(QueryClient);
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
  readonly order = signal<TableOrder<CatalogColumn> | null>(null);
  readonly first = signal(0);
  sort(column: CatalogColumn) {
    this.order.update(current => nextTableOrder(current, column)); this.first.set(0);
  }
  reset() {
    this.first.set(0);
    this.model.set({ search: '', category: '', status: '' });
  }
  categories = computed(() => [...new Set(this.terms().map((t) => t.category || this.absentCategory))].sort());
  statuses = computed(() => [...new Set(this.terms().map((t) => t.status))].sort());
  filtered = computed(() => {
    const rows = this.terms().filter(
      (t) =>
        (!this.model().category || (t.category || this.absentCategory) === this.model().category) &&
        (!this.model().status || t.status === this.model().status) &&
        Object.values(t).join(' ').toLowerCase().includes(this.model().search.toLowerCase()),
    );
    const order = this.order();
    return order ? sortTableRows(rows, term => order.column === 'category'
      ? (term.category ? this.categoryLabel(term.category) : null) : term[order.column], order.direction) : rows;
  });
}
