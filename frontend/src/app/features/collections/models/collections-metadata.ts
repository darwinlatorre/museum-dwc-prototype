import type { Signal } from '@angular/core';
import type { CatalogSnapshot } from '../../catalog/models/catalog-sync-result';
import type { Term } from '../../catalog/models/catalog-term';
import type { ValidationConfiguration } from '../../record-sources/models/validation-configuration';

/** Shell-owned metadata. Refresh never replaces a biological draft. */
export interface CollectionsMetadata {
  terms: Signal<Term[] | undefined>;
  configuration: Signal<ValidationConfiguration | undefined>;
  snapshot: Signal<CatalogSnapshot | undefined>;
  available: Signal<boolean>;
  refresh: () => Promise<boolean>;
}
