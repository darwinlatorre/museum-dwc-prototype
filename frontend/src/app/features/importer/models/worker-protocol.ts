import type { ValidationConfiguration } from '../../record-sources/models/validation-configuration';
import type { Term } from '../../catalog/models/catalog-term';
import type { Dataset } from './dataset';
import type { Context } from './context';
import type { Issue } from './analysis-result';
import type { Change, Normalization } from './normalization';

export type WorkerRequest =
  | { id: number; kind: 'parse'; file: File; sheet?: string }
  | {
      id: number;
      kind: 'validate';
      data: Dataset;
      mapping: Record<string, string>;
      configuration: ValidationConfiguration;
      terms: Term[];
      context: Context;
      options: Normalization;
    };
export type WorkerResponse =
  | { id: number; kind: 'sheets'; sheets: string[] }
  | { id: number; kind: 'parsed'; data: Dataset }
  | { id: number; kind: 'result'; issues: Issue[]; changes: Change[] }
  | { id: number; kind: 'error'; message: string };
