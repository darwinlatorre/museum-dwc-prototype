import { Component, computed, inject, input, signal } from '@angular/core';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { Api } from '../../core/api/api';
import { form, FormField } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import type { Term } from './models/catalog-term';
@Component({
  selector: 'app-catalog',
  imports: [FormField, TableModule],
  templateUrl: './catalog.html',
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
