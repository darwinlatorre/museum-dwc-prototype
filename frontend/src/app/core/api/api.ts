import { Injectable } from '@angular/core';

/** Metadata only: this service deliberately has no upload method. */
@Injectable({ providedIn: 'root' })
export class Api {
  async request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
    const response = await fetch('/api/' + path, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => {
      throw new Error(
        'No se pudo conectar con el servidor. Actualice los datos antes de volver a intentarlo.',
      );
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `API ${response.status}: ${text.slice(0, 500) || 'Error del servidor'}. No se guardaron los cambios. Actualice los datos antes de volver a intentarlo.`,
      );
    }
    return response.json() as Promise<T>;
  }
}
