import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StatusPage } from '../../shared/ui/status-page/status-page';

@Component({
  selector: 'app-not-found-page',
  imports: [StatusPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<museum-status-page code="404" heading="Página no encontrada"
    message="La dirección no corresponde a ninguna sección del museo. Revise el enlace o vuelva al análisis de colecciones." />`,
})
export class NotFoundPage {}
