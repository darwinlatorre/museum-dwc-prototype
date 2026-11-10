import type { CanDeactivateFn } from '@angular/router';
import type { RecordSourcesPage } from '../pages/record-sources-page/record-sources-page';

export const unsavedConfiguration: CanDeactivateFn<RecordSourcesPage> = page => page.canLeave();
