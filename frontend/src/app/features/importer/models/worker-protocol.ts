import type { ValidationConfiguration } from '../../record-sources/models/validation-configuration';
import type { Term } from '../../catalog/models/catalog-term';
import type { SourceRecord } from '../../collections/models/collection';
import type { Dataset } from './dataset';
import type { Context } from './context';
import type { Issue } from './analysis-result';
import type { Change, Normalization } from './normalization';

export interface AnalysisToken { session: number; generation: number }
export interface DuplicateCounts {
  equalRows: { groups: number; affectedRows: number };
  occurrenceIds: { groups: number; affectedRows: number };
}
export type WorkerRequest =
  | { id: number; kind: 'parse'; file: File; sheet?: string }
  | ({ id: number; kind: 'validate'; data?: Dataset; mapping: Record<string, string>;
      configuration: ValidationConfiguration; terms: Term[]; context: Context; options: Normalization } & AnalysisToken)
  | ({ id: number; kind: 'prepare'; offset: number } & AnalysisToken)
  | ({ id: number; kind: 'dispose' } & AnalysisToken);
export type WorkerResponse =
  | { id: number; kind: 'sheets'; sheets: string[] }
  | { id: number; kind: 'parsed'; data: Dataset }
  | ({ id: number; kind: 'result'; issues: Issue[]; changes: Change[]; duplicates: DuplicateCounts } & AnalysisToken)
  | ({ id: number; kind: 'prepared'; offset: number; rows: SourceRecord[]; done: boolean } & AnalysisToken)
  | { id: number; kind: 'error'; message: string; session?: number; generation?: number };
