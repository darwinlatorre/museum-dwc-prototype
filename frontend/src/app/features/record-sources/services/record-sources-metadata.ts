import { inject, Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';
import type { ValidationConfiguration } from '../models/validation-configuration';

@Injectable({ providedIn: 'root' })
export class RecordSourcesMetadata {
  private readonly api = inject(Api);
  validationConfiguration = (signal?: AbortSignal) =>
    this.api.request<ValidationConfiguration>('validation-configuration', 'GET', undefined, signal);
  updateValidationConfiguration = (body: ValidationConfiguration) =>
    this.api.request<ValidationConfiguration>('validation-configuration', 'PUT', body);
}
