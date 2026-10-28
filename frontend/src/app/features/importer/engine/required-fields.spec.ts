import { missingCells, missingFields, requiredFields } from './required-fields';
import { configurationFixture, contextKeys, requiredSets } from '../../../testing/validation-fixture';

const options = { trim: false, emptyMarkers: false };
describe('Requisitos globales por contexto (S2–S5)', () => {
  it.each(contextKeys)('usa exclusivamente la lista exacta de %s del servidor', context => {
    const configuration = configurationFixture();
    expect(requiredFields(configuration, context)).toEqual(requiredSets[context]);
    expect(requiredFields(configuration, context)).toHaveLength({ collection: 30, permit: 22, sampling: 10, marine: 15, other: 8 }[context]);
    expect(requiredFields(configuration, context).includes('disposition')).toBe(context === 'permit');
  });
  it('respeta una lista vacía explícita y campos arbitrarios sin recorte', () => {
    expect(requiredFields(configurationFixture([]), 'other')).toEqual([]);
    expect(requiredFields(configurationFixture(['  campo libre  ']), 'other')).toEqual(['  campo libre  ']);
  });
  it('cuenta una vez cada fila y conserva mapeo, filas físicas y originales', () => {
    const data = { headers: ['alias'], rows: [{ row: 2, values: [''] }, { row: 8, values: ['dato'] }] };
    const before = JSON.stringify(data);
    expect(missingFields(data, { alias: 'field' }, configurationFixture(['field', 'absent']), 'collection', options)).toEqual([
      { field: 'absent', missing: 2, total: 2, columnAbsent: true },
      { field: 'field', missing: 1, total: 2, columnAbsent: false },
    ]);
    expect(missingCells(data, { alias: 'field' }, 'field', options)).toEqual([
      { header: 'alias', column: 1, field: 'field', row: 2, before: '', after: '' },
    ]);
    expect(JSON.stringify(data)).toBe(before);
  });
  it('aplica exactamente las opciones aprobadas para NULL y N/A sin modificar originales', () => {
    const data = { headers: ['field'], rows: ['', 'NULL', ' n/a ', 'valor'].map((value, index) => ({ row: index + 2, values: [value] })) };
    const config = configurationFixture(['field']);
    expect(missingFields(data, {}, config, 'other', options)[0].missing).toBe(1);
    expect(missingFields(data, {}, config, 'other', { trim: false, emptyMarkers: true })[0].missing).toBe(2);
    expect(missingFields(data, {}, config, 'other', { trim: true, emptyMarkers: true })[0].missing).toBe(3);
    expect(data.rows.map(row => row.values[0])).toEqual(['', 'NULL', ' n/a ', 'valor']);
  });
  it('distingue una columna ausente aunque no haya registros', () => {
    expect(missingFields({ headers: [], rows: [] }, {}, configurationFixture(['field']), 'other', options))
      .toEqual([{ field: 'field', missing: 0, total: 0, columnAbsent: true }]);
  });
});
