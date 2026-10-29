import type { Normalization } from '../models/normalization';

export function calendar(y: number, m: number, d: number): boolean {
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return Number.isInteger(y) && y >= 1 && y <= 9999 && Number.isInteger(m) && m >= 1 && m <= 12 &&
    Number.isInteger(d) && d >= 1 && d <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/** Common ISO forms only; absence of components remains meaningful. No Date rollover/timezone conversion. */
export function isoComponents(value: string): number[] | null {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(?:Z|([+-])(\d{2}):(\d{2}))?)?)?)?$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, , , zoneHour, zoneMinute] = match;
  const y = Number(year), m = month === undefined ? undefined : Number(month), d = day === undefined ? undefined : Number(day);
  if (y < 1 || (m !== undefined && (m < 1 || m > 12)) || (d !== undefined && !calendar(y, m!, d))) return null;
  if (hour !== undefined && (Number(hour) > 23 || Number(minute) > 59 || (second !== undefined && Number(second) > 59))) return null;
  if (zoneHour !== undefined && (Number(zoneHour) > 14 || Number(zoneMinute) > 59 || (Number(zoneHour) === 14 && Number(zoneMinute) !== 0))) return null;
  return [y, ...(m === undefined ? [] : [m]), ...(d === undefined ? [] : [d])];
}

export function validIsoDate(value: string): boolean {
  const parts = value.split('/');
  return parts.length <= 2 && parts.every(part => isoComponents(part) !== null);
}

export function normalizeDate(value: string, order: Normalization['dateOrder']): string {
  if (validIsoDate(value)) return value;
  let y: string, m: string, d: string;
  const yearFirst = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value);
  if (yearFirst) [, y, m, d] = yearFirst;
  else {
    if (order !== 'DMY' && order !== 'MDY') return value;
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (!match) return value;
    y = match[3];
    [m, d] = order === 'DMY' ? [match[2], match[1]] : [match[1], match[2]];
  }
  return calendar(Number(y), Number(m), Number(d)) ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : value;
}
