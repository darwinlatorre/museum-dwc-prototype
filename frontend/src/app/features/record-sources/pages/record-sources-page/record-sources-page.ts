import { Component, inject, viewChild } from '@angular/core';
import type { Signal } from '@angular/core';
import { ROUTER_OUTLET_DATA } from '@angular/router';
import type { MuseumMetadata } from '../../../../layouts/museum-layout/museum-metadata';
import { ValidationConfigurationEditor } from '../validation-configuration/validation-configuration';

@Component({
  selector: 'app-record-sources-page', imports: [ValidationConfigurationEditor],
  templateUrl: './record-sources-page.html',
})
export class RecordSourcesPage {
  readonly metadata = inject(ROUTER_OUTLET_DATA) as Signal<MuseumMetadata>;
  private readonly editor = viewChild(ValidationConfigurationEditor);
  canLeave() {
    const editor = this.editor();
    return !editor || !(editor.dirty() || editor.field()) ||
      window.confirm('Hay cambios sin guardar. ¿Desea descartarlos y salir de la configuración?');
  }
}
