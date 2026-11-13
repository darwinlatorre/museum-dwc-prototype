import { describe, expect, it } from 'vitest';
import { assertImportLimits } from './import-limits';
import type { ImportRequest } from '../../collections/models/collection';
const body = (): ImportRequest => ({ collectionId: null, expectedRevision: null, name: 'Colección', context: 'collection', configurationRevision: 7,
  catalogVersion: 1, warningsConfirmed: false, idempotencyKey: '11111111-1111-4111-8111-111111111111', headers: ['a'], mapping: {},
  rows: [{ sourceRow: 19, originalValues: [' 0001 '], values: [' 0001 '] }] });
describe('límites de la confirmación exacta', () => {
  it('no recorta, convierte ni cambia originales admitidos', () => {
    const input = body(), original = structuredClone(input);
    assertImportLimits(input); expect(input).toEqual(original);
  });
  it.each(['\u0000', '\uD800', '\uDC00', 'a'.repeat(100001)])('rechaza texto no persistible sin modificarlo (%#)', value => {
    const input = body(); input.rows[0].values = [value]; const original = structuredClone(input);
    expect(() => assertImportLimits(input)).toThrow('texto no admitido'); expect(input).toEqual(original);
  });
  it.each([0, 50001])('rechaza %s filas sin truncarlas', count => {
    const input = body(); input.rows = Array.from({ length: count }, (_, i) => ({ sourceRow: i + 1, originalValues: ['x'], values: ['x'] }));
    expect(() => assertImportLimits(input)).toThrow('50.000'); expect(input.rows).toHaveLength(count);
  });
  it('rechaza 20 Mi UTF-16 acumulados y el JSON escapado de más de 32 MiB por separado', () => {
    for (const [value, count, error] of [['a'.repeat(100000), 105, '20 Mi'], ['"'.repeat(90000), 100, '32 MiB']] as const) {
      const input = body(); input.rows = Array.from({ length: count }, (_, i) => ({ sourceRow: i + 1, originalValues: [value], values: [value] }));
      expect(() => assertImportLimits(input)).toThrow(error); expect(input.rows).toHaveLength(count);
    }
  });
});
