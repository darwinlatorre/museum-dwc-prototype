import type { Change, Normalization } from '../models/normalization';
import type { Dataset } from '../models/dataset';
export function normalize(
  original: Dataset,
  options: Normalization,
): { data: Dataset; changes: Change[] } {
  const changes: Change[] = [];
  const rows = original.rows.map((row) => ({
    ...row,
    values: row.values.map((before, index) => {
      let after = options.trim ? before.trim() : before;
      if (options.emptyMarkers && /^(null|n\/a)$/i.test(after)) after = '';
      if (before !== after)
        changes.push({ row: row.row, field: original.headers[index], before, after });
      return after;
    }),
  }));
  return { data: { headers: [...original.headers], rows }, changes };
}
