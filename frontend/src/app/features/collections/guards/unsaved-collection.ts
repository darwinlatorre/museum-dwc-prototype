import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn, CanDeactivateFn } from '@angular/router';
import type { CollectionsPage } from '../pages/collections-page/collections-page';

@Injectable({ providedIn: 'root' })
export class CollectionNavigation {
  current?: CollectionsPage;
  readonly uncertainCollections = new Set<string>();
}
export const unsavedCollection: CanDeactivateFn<CollectionsPage> = page => page.canLeave();
// Angular reuses the detail component for a different :id; canDeactivate does not run there.
export const collectionNavigation: CanActivateFn = route => {
  const current = inject(Router).routerState.snapshot.root.firstChild?.firstChild;
  return current?.routeConfig !== route.routeConfig || (inject(CollectionNavigation).current?.canLeave() ?? true);
};
