import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { abortable, BASE_URL } from '../../../core/api/api';
import { CollectionApiError } from '../models/collection';
import type { AddRecord, CollectionInfo, CollectionProblem, CollectionRecord, EditRecord, ImportReceipt, ImportRequest, Page, RestoreRecord, TrashFilter } from '../models/collection';

export interface RecordSort { field: string | null; direction: 'asc' | 'desc' }

/** Biological reads/writes deliberately bypass Query and its metadata cache. */
@Injectable({ providedIn: 'root' })
export class CollectionsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(BASE_URL).replace(/\/+$/, '');
  list = (page = 0, size = 50, signal?: AbortSignal) => this.request<Page<CollectionInfo>>(`collections?page=${page}&size=${size}`, 'GET', undefined, signal);
  detail = (id: string, signal?: AbortSignal) => this.request<CollectionInfo>(`collections/${encodeURIComponent(id)}`, 'GET', undefined, signal);
  records = (id: string, page = 0, size = 50, trash: TrashFilter = 'ACTIVE', signal?: AbortSignal, sort?: RecordSort) => {
    const order = !sort || (sort.field === null && sort.direction === 'asc') ? ''
      : `${sort.field === null ? '' : `&sortField=${encodeURIComponent(sort.field)}`}&sortDirection=${sort.direction === 'asc' ? 'ASC' : 'DESC'}`;
    return this.request<Page<CollectionRecord>>(`collections/${encodeURIComponent(id)}/records?page=${page}&size=${size}&trash=${trash}${order}`, 'GET', undefined, signal);
  };
  record = (id: string, recordId: string, signal?: AbortSignal) => this.request<CollectionRecord>(this.recordPath(id, recordId), 'GET', undefined, signal);
  import = (body: ImportRequest, signal?: AbortSignal) => this.request<ImportReceipt>('collections/imports', 'POST', body, signal);
  add = (id: string, body: AddRecord, signal?: AbortSignal) => this.request<CollectionInfo>(`collections/${encodeURIComponent(id)}/records`, 'POST', body, signal);
  edit = (id: string, recordId: string, body: EditRecord, signal?: AbortSignal) => this.request<CollectionInfo>(this.recordPath(id, recordId), 'PUT', body, signal);
  trash = (id: string, recordId: string, expectedRevision: number, signal?: AbortSignal) => this.request<CollectionInfo>(`${this.recordPath(id, recordId)}/trash`, 'POST', { expectedRevision }, signal);
  restore = (id: string, recordId: string, body: RestoreRecord, signal?: AbortSignal) => this.request<CollectionInfo>(`${this.recordPath(id, recordId)}/restore`, 'POST', body, signal);
  emoji = (id: string, emoji: string | null, expectedRevision: number, signal?: AbortSignal) =>
    this.request<CollectionInfo>(`collections/${encodeURIComponent(id)}/emoji`, 'PUT', { emoji, expectedRevision }, signal);
  private recordPath(id: string, recordId: string) { return `collections/${encodeURIComponent(id)}/records/${encodeURIComponent(recordId)}`; }
  private request<T>(path: string, method: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return abortable(this.http.request<T>(method, `${this.base}/${path}`, { body: body ?? null })
      .pipe(catchError((error: unknown) => throwError(() => collectionError(error)))), signal);
  }
}

function collectionError(error: unknown): CollectionApiError {
  const response = error instanceof HttpErrorResponse ? error : undefined;
  const raw: unknown = response?.error;
  const problem: Partial<CollectionProblem> = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as CollectionProblem : {};
  const authorityRejected = response?.status === 503 && problem.code === 'AUTHORITY_UNAVAILABLE';
  return new CollectionApiError({ ...problem, status: response?.status ?? 0 },
    !response || response.status === 0 || (response.status >= 500 && !authorityRejected));
}
