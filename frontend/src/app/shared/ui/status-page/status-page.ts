import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

let nextHeading = 0;

/** Pantalla de estado reutilizable (no encontrado, error): presentación pura, sin HTTP ni navegación propia. */
@Component({
  selector: 'museum-status-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-page.html',
  styleUrl: './status-page.css',
})
export class StatusPage {
  /** Código visible (p. ej. 404); sin código se muestra un símbolo de aviso. */
  readonly code = input<string>();
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly linkLabel = input('Ir a Análisis de colecciones');
  readonly link = input('/analisis');
  /** Con etiqueta, reintentar pasa a ser la acción principal y el enlace queda secundario. */
  readonly retryLabel = input<string>();
  readonly retry = output<void>();
  readonly headingId = `status-page-title-${++nextHeading}`;
}
