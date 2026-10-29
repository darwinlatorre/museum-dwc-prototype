import type { Context } from '../../record-sources/models/validation-configuration';
export interface Issue {
  field: string;
  row: number | null;
  description: string;
  severity: 'ERROR' | 'WARNING';
  context: Context | 'system';
  configurationRevision: number;
}
