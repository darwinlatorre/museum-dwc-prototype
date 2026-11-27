import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, firstValueFrom, fromEvent, merge, NEVER, type Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const BASE_URL = new InjectionToken<string>('baseUrl', {
  providedIn: 'root', factory: () => environment.baseUrl,
});

const cancelled = () => new DOMException('Solicitud cancelada', 'AbortError');

/**
 * Bridges an HttpClient call to the Promise + AbortSignal contract of TanStack Query.
 * Aborting errors the merged stream, which unsubscribes (cancels) HTTP and removes the listener.
 */
export function abortable<T>(request: Observable<T>, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(cancelled());
  const abort = signal ? fromEvent(signal, 'abort').pipe(switchMap(() => throwError(cancelled))) : NEVER;
  return firstValueFrom(merge(request, abort));
}

function apiError(error: unknown): Error {
  if (!(error instanceof HttpErrorResponse) || error.status === 0) {
    return new Error('No pudimos cargar o guardar los datos. Revise su conexión y actualice los datos antes de volver a intentarlo.');
  }
  const body: unknown = error.error;
  const problem = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const text = [problem['detail'], problem['title'], typeof body === 'string' ? body : undefined]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return Object.assign(new Error(`No se pudo completar la solicitud: ${text?.slice(0, 500) || 'Inténtelo de nuevo más tarde'}. Actualice los datos antes de volver a intentarlo.`), {
    status: error.status, code: problem['code'],
  });
}

/** Metadata only: this service deliberately has no upload method. */
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(BASE_URL).replace(/\/+$/, '');

  request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
    return abortable(this.http.request<T>(method, `${this.baseUrl}/${path}`, { body: body ?? null })
      .pipe(catchError((error: unknown) => throwError(() => apiError(error)))), signal);
  }
}
