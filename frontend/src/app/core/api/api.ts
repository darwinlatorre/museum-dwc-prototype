import { Injectable } from '@angular/core';
import type { ValidationConfiguration } from '../../features/record-sources/models/validation-configuration';
import type { Term } from '../../features/catalog/models/catalog-term';

export interface CatalogSyncResult {
  outcome: 'SUCCESS' | 'FAILED' | 'SUPERSEDED';
  status: {
    active: {
      revision: string; hash: string; snapshotVersion: number; activatedAt: string;
      termCount: number; added: number; modified: number; deprecated: number;
      sourceHashes: Record<string, string>;
    };
    attempts: number; lastAttempt: string | null; lastFailure: string | null;
  };
}

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
  catalog = (signal?: AbortSignal) => this.request<Term[]>('catalog', 'GET', undefined, signal);
  syncCatalog = () => this.request<CatalogSyncResult>('catalog/sync', 'POST');
  validationConfiguration = (signal?: AbortSignal) =>
    this.request<ValidationConfiguration>('validation-configuration', 'GET', undefined, signal);
  updateValidationConfiguration = (body: ValidationConfiguration) =>
    this.request<ValidationConfiguration>('validation-configuration', 'PUT', body);
}
