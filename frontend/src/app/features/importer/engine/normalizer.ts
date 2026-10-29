import type { Change, Normalization } from '../models/normalization';
import type { Dataset } from '../models/dataset';
import { effectiveField, normalizeCell } from './normalization-rules';
export function normalize(
  original: Dataset,
  options: Normalization,
  mapping?: Record<string, string>,
): { data: Dataset; changes: Change[] } {
  const changes: Change[] = [];
  const rows = original.rows.map((row) => ({
    ...row,
    values: row.values.map((before, index) => {
      const { after } = normalizeCell(before, effectiveField(original.headers[index], mapping), options);
      if (before !== after)
        changes.push({ row: row.row, field: original.headers[index], before, after });
      return after;
    }),
  }));
  return { data: { headers: [...original.headers], rows }, changes };
}
