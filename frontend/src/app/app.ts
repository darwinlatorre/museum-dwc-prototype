import { Component, inject, signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Api } from './api';
import { Catalog } from './catalog';
import { Profiles } from './profiles';
import { ImportWorkbench } from './import-workbench';
@Component({
  selector: 'app-root',
  imports: [Catalog, Profiles, ImportWorkbench],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  api = inject(Api);
  page = signal<'workbench' | 'profiles' | 'catalog'>('workbench');
  catalog = injectQuery(() => ({
    queryKey: ['catalog'],
    queryFn: ({ signal }) => this.api.catalog(signal),
    staleTime: 300000,
  }));
  profiles = injectQuery(() => ({
    queryKey: ['profiles'],
    queryFn: ({ signal }) => this.api.profiles(signal),
    staleTime: 30000,
  }));
  retry() {
    void this.catalog.refetch();
    void this.profiles.refetch();
  }
}
