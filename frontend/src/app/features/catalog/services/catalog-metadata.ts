import { inject, Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';
import type { Term } from '../models/catalog-term';
import type { CatalogSnapshot, CatalogSyncResult } from '../models/catalog-sync-result';

@Injectable({ providedIn: 'root' })
export class CatalogMetadata {
  private readonly api = inject(Api);
  catalog = (signal?: AbortSignal) => this.api.request<Term[]>('catalog', 'GET', undefined, signal);
  async snapshot(signal?: AbortSignal): Promise<CatalogSnapshot> {
    const before = await this.api.request<CatalogSyncResult['status']>('catalog/status', 'GET', undefined, signal);
    const terms = await this.catalog(signal);
    const after = await this.api.request<CatalogSyncResult['status']>('catalog/status', 'GET', undefined, signal);
    if (!before.active || !after.active || before.active.snapshotVersion !== after.active.snapshotVersion)
      throw new Error('El catálogo TDWG cambió durante la lectura; actualice los metadatos y vuelva a analizar.');
    return { terms, snapshotVersion: after.active.snapshotVersion };
  }
  syncCatalog = () => this.api.request<CatalogSyncResult>('catalog/sync', 'POST');
}
