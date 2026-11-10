import type { Signal } from '@angular/core';
import type { Term } from '../../features/catalog/models/catalog-term';
import type { ValidationConfiguration } from '../../features/record-sources/models/validation-configuration';

/** Reactive outlet contract: server metadata only, never the local dataset. */
export interface MuseumMetadata {
  terms: Signal<Term[] | undefined>;
  configuration: Signal<ValidationConfiguration | undefined>;
}
