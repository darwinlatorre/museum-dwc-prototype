import { Component, inject } from '@angular/core';
import { ROUTER_OUTLET_DATA } from '@angular/router';
import type { Signal } from '@angular/core';
import type { MuseumMetadata } from '../../../../layouts/museum-layout/museum-metadata';
import { Catalog } from '../catalog/catalog';

@Component({ selector: 'app-catalog-page', imports: [Catalog], templateUrl: './catalog-page.html' })
export class CatalogPage {
  readonly metadata = inject(ROUTER_OUTLET_DATA) as Signal<MuseumMetadata>;
}
