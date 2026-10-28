import type { Condition, Profile, Rule } from '../../profiles/models/profile';
import type { Context } from '../models/context';
import { missingFields, requiredFields } from './required-fields';

const options = { trim: false, emptyMarkers: false };
const emptyContext: Context = { collection: false, permit: false, sampling: false, marine: false };
const rule = (field: string, kind: Rule['kind'] = 'required', condition: Condition = 'always'): Rule =>
  ({ field, kind, condition, severity: 'ERROR', message: 'Texto original', source: '' });
const profile = (rules: Rule[]): Profile => ({ id: 'p', name: 'Perfil', version: '1', status: 'PUBLISHED', revision: 0, description: '', rules });

describe('Requisitos de campos y recuentos de registros', () => {
  it('respeta todas las condiciones y exige ambos contextos para permiso y colección', () => {
    const conditions: Condition[] = ['always', 'collection', 'permit', 'sampling', 'marine', 'permitAndCollection'];
    const profiles = [profile(conditions.map(condition => rule(condition, 'required', condition)))];
    expect(requiredFields(profiles, emptyContext)).toEqual(['always']);
    for (const key of ['collection', 'permit', 'sampling', 'marine'] as const)
      expect(requiredFields(profiles, { ...emptyContext, [key]: true })).toEqual(['always', key]);
    expect(requiredFields(profiles, { ...emptyContext, collection: true, permit: true }))
      .toEqual(['always', 'collection', 'permit', 'permitAndCollection']);
  });

  it('no bloquea advertencias ni convierte las reglas de formato en requisitos de presencia', () => {
    const profiles = [profile([rule('required'), rule('column', 'requiredColumn'),
      { ...rule('warning'), severity: 'WARNING' }, rule('date', 'date'), rule('latitude', 'latitude'), rule('longitude', 'longitude')])];
    expect(requiredFields(profiles, emptyContext, true)).toEqual(['required', 'column']);
    expect(requiredFields(profiles, emptyContext)).toEqual(['required', 'column', 'warning']);
  });

  it('cuenta una vez cada fila, conserva mapeo y no exige valores para requiredColumn', () => {
    const data = { headers: ['alias', 'column'], rows: [{ row: 2, values: ['', ''] }, { row: 8, values: ['dato', ''] }] };
    const p = profile([rule('field'), rule('column', 'requiredColumn'), rule('absent', 'requiredColumn')]);
    expect(missingFields(data, { alias: 'field' }, [p, p], emptyContext, options)).toEqual([
      { field: 'absent', missing: 2, total: 2, columnAbsent: true },
      { field: 'field', missing: 1, total: 2, columnAbsent: false },
    ]);
    expect(data.headers).toEqual(['alias', 'column']);
    expect(data.rows[0].values).toEqual(['', '']);
  });

  it('aplica exactamente las opciones aprobadas para NULL y N/A sin modificar originales', () => {
    const data = { headers: ['field'], rows: ['', 'NULL', ' n/a ', 'valor'].map((value, index) => ({ row: index + 2, values: [value] })) };
    const profiles = [profile([rule('field')])];
    expect(missingFields(data, {}, profiles, emptyContext, options)[0].missing).toBe(1);
    expect(missingFields(data, {}, profiles, emptyContext, { trim: false, emptyMarkers: true })[0].missing).toBe(2);
    expect(missingFields(data, {}, profiles, emptyContext, { trim: true, emptyMarkers: true })[0].missing).toBe(3);
    expect(data.rows.map(row => row.values[0])).toEqual(['', 'NULL', ' n/a ', 'valor']);
  });

  it('distingue una columna ausente aunque no haya registros', () => {
    expect(missingFields({ headers: [], rows: [] }, {}, [profile([rule('field')])], emptyContext, options))
      .toEqual([{ field: 'field', missing: 0, total: 0, columnAbsent: true }]);
  });
});
