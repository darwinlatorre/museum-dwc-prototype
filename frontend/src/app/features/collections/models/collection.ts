import type { Context } from '../../record-sources/models/validation-configuration';
import type { Issue } from '../../importer/models/analysis-result';

export interface Page<T> { items: T[]; page: number; size: number; totalElements: number }
export interface CollectionInfo {
  id: string; name: string; context: Context; revision: number; activeCount: number; trashCount: number;
}
export interface SourceRecord { sourceRow: number; originalValues: string[]; values: string[] }
export interface CollectionRecord extends SourceRecord {
  id: string; collectionId: string; headers: string[]; mapping: Record<string, string>;
  importKey: string | null; configurationRevision: number; catalogVersion: number; trashed: boolean;
}
export interface ValidationConsent { configurationRevision: number; catalogVersion: number; warningsConfirmed: boolean }
export interface Revision { expectedRevision: number }
export interface ImportRequest extends ValidationConsent {
  collectionId: string | null; name: string | null; context: Context; expectedRevision: number | null;
  idempotencyKey: string; headers: string[]; mapping: Record<string, string>; rows: SourceRecord[];
}
export interface ImportReceipt { idempotencyKey: string; collectionId: string; revision: number; inserted: number }
export interface AddRecord extends Revision, ValidationConsent { headers: string[]; mapping: Record<string, string>; row: SourceRecord }
export interface EditRecord extends Revision, ValidationConsent { values: string[] }
export type RestoreRecord = Revision & ValidationConsent;
export type TrashFilter = 'ACTIVE' | 'TRASHED' | 'ALL';
export interface CollectionProblem { status: number; title?: string; detail?: string; instance?: string; code?: string; issues?: Issue[] }

/** A missing HTTP response is not evidence of rollback. */
export class CollectionApiError extends Error {
  constructor(readonly problem: CollectionProblem, readonly unknownOutcome: boolean) {
    super(problem.detail || problem.title || (unknownOutcome
      ? 'No se pudo confirmar el resultado de la solicitud.' : 'El servidor rechazó la solicitud.'));
    this.name = 'CollectionApiError';
  }
}
