import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CatalogMetadata } from '../../features/catalog/services/catalog-metadata';
import { RecordSourcesMetadata } from '../../features/record-sources/services/record-sources-metadata';
import { ImportWorkbench } from '../../features/importer/pages/import-workbench/import-workbench';

@Component({
  selector: 'app-museum-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ImportWorkbench],
  templateUrl: './museum-layout.html',
  styleUrl: './museum-layout.scss',
})
export class MuseumLayout {
  private readonly router = inject(Router);
  private readonly navigation = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd)));
  readonly analysisActive = computed(() => {
    this.navigation();
    return this.router.url.split(/[?#]/)[0] === '/analisis';
  });
  readonly normalizationVisible = signal(false);
  private readonly catalogApi = inject(CatalogMetadata);
  private readonly sourcesApi = inject(RecordSourcesMetadata);
  readonly catalog = injectQuery(() => ({
    queryKey: ['catalog'], queryFn: ({ signal }) => this.catalogApi.catalog(signal), staleTime: 300000,
  }));
  // Versioned metadata belongs to the shell, never to the biological data cache.
  readonly catalogSnapshot = injectQuery(() => ({
    queryKey: ['catalog', 'snapshot'], queryFn: ({ signal }) => this.catalogApi.snapshot(signal),
    enabled: typeof this.catalogApi.snapshot === 'function', staleTime: 300000,
  }));
  readonly configuration = injectQuery(() => ({
    queryKey: ['validation-configuration'],
    queryFn: ({ signal }) => this.sourcesApi.validationConfiguration(signal), staleTime: 30000,
  }));
  readonly metadata = {
    terms: this.catalog.data, configuration: this.configuration.data, snapshot: this.catalogSnapshot.data,
    available: computed(() => !!this.configuration.data() && !!this.catalogSnapshot.data()
      && !this.configuration.isError() && !this.catalogSnapshot.isError()
      && !this.configuration.isFetching() && !this.catalogSnapshot.isFetching()),
    refresh: async () => {
      const [configuration, snapshot] = await Promise.all([this.configuration.refetch(), this.catalogSnapshot.refetch()]);
      return configuration.isSuccess && snapshot.isSuccess;
    },
  };
  retry() {
    void this.catalog.refetch();
    void this.catalogSnapshot.refetch();
    void this.configuration.refetch();
  }
}
