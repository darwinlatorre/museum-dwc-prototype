import { Component, inject, signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Api } from './core/api/api';
import { Catalog } from './features/catalog/catalog';
import { ValidationConfigurationEditor } from './features/record-sources/validation-configuration';
import { ImportWorkbench } from './features/importer/workbench/import-workbench';
@Component({
  selector: 'app-root',
  imports: [Catalog, ValidationConfigurationEditor, ImportWorkbench],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '(window:beforeunload)': 'beforeUnload($event)' },
})
export class App {
  api = inject(Api);
  page = signal<'workbench' | 'configuration' | 'catalog'>('workbench');
  configurationDirty = signal(false);
  normalizationVisible = signal(false);
  navigate(page: 'workbench' | 'configuration' | 'catalog') {
    if (page === this.page()) return;
    if (this.configurationDirty() && !window.confirm('Hay cambios sin guardar. ¿Desea descartarlos y salir de la configuración?')) return;
    this.configurationDirty.set(false);
    this.page.set(page);
  }
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.configurationDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  catalog = injectQuery(() => ({
    queryKey: ['catalog'],
    queryFn: ({ signal }) => this.api.catalog(signal),
    staleTime: 300000,
  }));
  configuration = injectQuery(() => ({
    queryKey: ['validation-configuration'],
    queryFn: ({ signal }) => this.api.validationConfiguration(signal),
    staleTime: 30000,
  }));
  retry() {
    void this.catalog.refetch();
    void this.configuration.refetch();
  }
}
