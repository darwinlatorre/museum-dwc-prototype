import { compareTableValues } from './table-sort';

describe('Orden compartido de tablas', () => {
  it('ordena números físicos numéricamente, no como identificadores textuales', () => {
    expect([10, 2, 1].sort((a, b) => compareTableValues(a, b))).toEqual([1, 2, 10]);
    expect([1, 10, 2].sort((a, b) => compareTableValues(a, b, 'desc'))).toEqual([10, 2, 1]);
  });
  it('compara texto literal por puntos Unicode sin modificar espacios, ceros ni case', () => {
    const values = ['😀', '\uE000', 'a', 'A', '01', '001', ' ', '0'];
    expect([...values].sort((a, b) => compareTableValues(a, b))).toEqual([' ', '0', '001', '01', 'A', 'a', '\uE000', '😀']);
    expect(values).toEqual(['😀', '\uE000', 'a', 'A', '01', '001', ' ', '0']);
    expect(compareTableValues('01', '01')).toBe(0);
  });
  it('deja vacíos y ausentes al final en ambos sentidos sin tratar espacios o cero como vacío', () => {
    for (const direction of ['asc', 'desc'] as const) {
      expect(compareTableValues('', '0', direction)).toBeGreaterThan(0);
      expect(compareTableValues(undefined, ' ', direction)).toBeGreaterThan(0);
      expect(compareTableValues(null, '', direction)).toBe(0);
      expect(compareTableValues('0', null, direction)).toBeLessThan(0);
    }
  });
});
