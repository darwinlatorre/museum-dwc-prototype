import { inject, Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';
import type { Term } from '../models/catalog-term';
import type { CatalogSyncResult } from '../models/catalog-sync-result';

@Injectable({ providedIn: 'root' })
export class CatalogMetadata {
  private readonly api = inject(Api);
  catalog = (signal?: AbortSignal) => this.api.request<Term[]>('catalog', 'GET', undefined, signal);
  syncCatalog = () => this.api.request<CatalogSyncResult>('catalog/sync', 'POST');
}
