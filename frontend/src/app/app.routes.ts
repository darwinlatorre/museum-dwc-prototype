import { Routes } from '@angular/router';
import { MuseumLayout } from './layouts/museum-layout/museum-layout';
import { AnalysisPage } from './features/importer/pages/analysis-page/analysis-page';
import { collectionNavigation, unsavedCollection } from './features/collections/guards/unsaved-collection';
import { unsavedConfiguration } from './features/record-sources/guards/unsaved-configuration';

export const routes: Routes = [{
  path: '', component: MuseumLayout, children: [
    { path: '', pathMatch: 'full', redirectTo: 'analisis' },
    { path: 'analisis', component: AnalysisPage, title: 'Análisis de colecciones · Museo' },
    { path: 'fuentes-de-registros',
      loadComponent: () => import('./features/record-sources/pages/record-sources-page/record-sources-page').then(module => module.RecordSourcesPage),
      title: 'Fuentes de registros biológicos · Museo', canDeactivate: [unsavedConfiguration] },
    { path: 'catalogo',
      loadComponent: () => import('./features/catalog/pages/catalog-page/catalog-page').then(module => module.CatalogPage),
      title: 'Catálogo Darwin Core · Museo' },
    { path: 'collections',
      loadComponent: () => import('./features/collections/pages/collections-page/collections-page').then(module => module.CollectionsPage),
      title: 'Colecciones · Museo', canDeactivate: [unsavedCollection] },
    { path: 'collections/:id',
      loadComponent: () => import('./features/collections/pages/collections-page/collections-page').then(module => module.CollectionsPage),
      title: 'Detalle de colección · Museo', canDeactivate: [unsavedCollection], canActivate: [collectionNavigation] },
    { path: '**', redirectTo: 'analisis' },
  ],
}];
