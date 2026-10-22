export interface Term {
  name: string;
  uri: string;
  definition: string;
  category: string;
  status: string;
}
export type Condition =
  'always' | 'collection' | 'permit' | 'marine' | 'sampling' | 'permitAndCollection';
export interface Rule {
  field: string;
  kind: 'required' | 'requiredColumn' | 'date' | 'latitude' | 'longitude';
  severity: 'ERROR' | 'WARNING';
  condition: Condition;
  message: string;
  source: string;
}
export interface Profile {
  id: string;
  name: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED';
  revision: number;
  description: string;
  rules: Rule[];
}
export type ProfileInput = Pick<Profile, 'name' | 'version' | 'description' | 'rules'>;
export interface Context {
  collection: boolean;
  permit: boolean;
  marine: boolean;
  sampling: boolean;
}
export interface Dataset {
  headers: string[];
  rows: { row: number; values: string[] }[];
}
export interface Issue {
  field: string;
  row: number | null;
  description: string;
  severity: 'ERROR' | 'WARNING';
  profile: string;
  version: string;
}
export interface Normalization {
  trim: boolean;
  emptyMarkers: boolean;
}
export interface Change {
  row: number;
  field: string;
  before: string;
  after: string;
}
export const LIMITS = { bytes: 10 * 1024 * 1024, rows: 50000, columns: 500, issues: 100000 };
export type WorkerRequest =
  | { id: number; kind: 'parse'; file: File; sheet?: string }
  | {
      id: number;
      kind: 'validate';
      data: Dataset;
      mapping: Record<string, string>;
      profiles: Profile[];
      terms: Term[];
      context: Context;
      options: Normalization;
    };
export type WorkerResponse =
  | { id: number; kind: 'sheets'; sheets: string[] }
  | { id: number; kind: 'parsed'; data: Dataset }
  | { id: number; kind: 'result'; issues: Issue[]; changes: Change[] }
  | { id: number; kind: 'error'; message: string };
