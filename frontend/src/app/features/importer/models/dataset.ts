export interface Dataset {
  headers: string[];
  rows: { row: number; values: string[] }[];
}
export const LIMITS = { bytes: 10 * 1024 * 1024, rows: 50000, columns: 500, issues: 100000 };
