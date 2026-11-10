import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

export const BASE_URL = new InjectionToken<string>('baseUrl', {
  providedIn: 'root', factory: () => environment.baseUrl,
});

function apiError(error: unknown): Error {
  if (!(error instanceof HttpErrorResponse) || error.status === 0) {
    return new Error('No se pudo conectar con el servidor. Actualice los datos antes de volver a intentarlo.');
  }
  const body: unknown = error.error;
  const problem = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const text = [problem['detail'], problem['title'], typeof body === 'string' ? body : undefined]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return new Error(`API ${error.status}: ${text?.slice(0, 500) || 'Error del servidor'}. No se guardaron los cambios. Actualice los datos antes de volver a intentarlo.`);
}

/** Metadata only: this service deliberately has no upload method. */
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(BASE_URL).replace(/\/+$/, '');

  request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (signal?.aborted) { reject(new DOMException('Solicitud cancelada', 'AbortError')); return; }
      const subscription = new Subscription();
      const cleanup = () => signal?.removeEventListener('abort', abort);
      const abort = () => {
        subscription.unsubscribe(); cleanup();
        reject(new DOMException('Solicitud cancelada', 'AbortError'));
      };
      signal?.addEventListener('abort', abort, { once: true });
      subscription.add(this.http.request<T>(method, `${this.baseUrl}/${path}`, { body: body ?? null }).subscribe({
        next: value => { cleanup(); resolve(value); },
        error: (error: unknown) => { cleanup(); reject(apiError(error)); },
      }));
    });
  }
}
