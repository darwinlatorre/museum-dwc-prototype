export interface Issue {
  field: string;
  row: number | null;
  description: string;
  severity: 'ERROR' | 'WARNING';
  profile: string;
  version: string;
}
