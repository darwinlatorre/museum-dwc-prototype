export type TableSortDirection = 'asc' | 'desc';

/** Orden de presentación literal; compatible con COLLATE C de PostgreSQL. */
export function compareTableValues(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
  direction: TableSortDirection = 'asc',
): number {
  const leftEmpty = left == null || left === '';
  const rightEmpty = right == null || right === '';
  if (leftEmpty || rightEmpty) return Number(leftEmpty) - Number(rightEmpty);
  const sign = direction === 'asc' ? 1 : -1;
  if (typeof left === 'number' && typeof right === 'number') return (left - right) * sign;
  const a = String(left), b = String(right);
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    const x = a.codePointAt(i)!, y = b.codePointAt(j)!;
    if (x !== y) return (x - y) * sign;
    i += x > 0xffff ? 2 : 1;
    j += y > 0xffff ? 2 : 1;
  }
  return (a.length - b.length) * sign;
}
