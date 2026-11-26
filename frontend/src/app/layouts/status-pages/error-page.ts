import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StatusPage } from '../../shared/ui/status-page/status-page';

/** Destino de los errores de navegación (p. ej. una sección que no se pudo descargar). */
@Component({
  selector: 'app-error-page',
  imports: [StatusPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<museum-status-page heading="No pudimos mostrar esta página" retryLabel="Reintentar" (retry)="reload()"
    message="La sección no se pudo cargar. Compruebe la conexión y vuelva a intentarlo; los datos guardados no se modificaron." />`,
})
export class ErrorPage {
  private readonly document = inject(DOCUMENT);
  // La navegación fallida conserva su URL (skipLocationChange): recargar vuelve a intentarla.
  reload() { this.document.defaultView?.location.reload(); }
}
