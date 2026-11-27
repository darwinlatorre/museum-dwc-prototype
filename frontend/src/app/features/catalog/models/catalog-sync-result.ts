import type { Term } from './catalog-term';

export interface CatalogSnapshot { terms: Term[]; snapshotVersion: number }

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
