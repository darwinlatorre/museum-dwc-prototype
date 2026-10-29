import { LIMITS, type Dataset } from '../models/dataset';
import type { Issue } from '../models/analysis-result';
import type { PreviewMetadata, DuplicateGroup } from '../models/normalization-preview';
import { effectiveField } from './normalization-rules';

export interface DuplicateIndex {
  metadata: PreviewMetadata['duplicates'];
  equalMembership: Map<number, string>;
  idMembership: Map<number, string>;
}

/** The same incremental detector is consumed synchronously by Apply and cooperatively by preview. */
export function* duplicateGroups(data: Dataset, mapping: Record<string, string>, enabled: boolean): Generator<void, DuplicateIndex> {
  const index = data.headers.findIndex(header => effectiveField(header, mapping) === 'occurrenceID');
  const metadata: PreviewMetadata['duplicates'] = { enabled, occurrenceIdColumnIndex: index < 0 ? null : index,
    equalRows: { groups: [], affectedRows: 0 }, occurrenceIds: { groups: [], affectedRows: 0 } };
  const equalMembership = new Map<number, string>(), idMembership = new Map<number, string>();
  if (!enabled) return { metadata, equalMembership, idMembership };
  const rows = new Map<string, number[]>(), ids = new Map<string, number[]>();
  const collect = (map: Map<string, number[]>, key: string, row: number) => {
    const group = map.get(key);
    if (group) group.push(row); else map.set(key, [row]);
  };
  let work = 0;
  for (const row of data.rows) {
    collect(rows, JSON.stringify(row.values), row.row);
    const id = index < 0 ? '' : row.values[index];
    if (id?.trim()) collect(ids, id, row.row);
    if (++work % 256 === 0) yield;
  }
  for (const [map, target, membership, namespace] of [
    [rows, metadata.equalRows, equalMembership, 'row'],
    [ids, metadata.occurrenceIds, idMembership, 'id'],
  ] as const) {
    for (const members of map.values()) {
      if (members.length > 1) {
        const group: DuplicateGroup = { groupId: `${namespace}:${target.groups.length + 1}`, sourceRows: members };
        target.groups.push(group);
        target.affectedRows += members.length;
        for (const row of members) {
          membership.set(row, group.groupId);
          if (++work % 256 === 0) yield;
        }
      }
      if (++work % 256 === 0) yield;
    }
  }
  return { metadata, equalMembership, idMembership };
}

export function appendDuplicateWarnings(issues: Issue[], data: Dataset, mapping: Record<string, string>, revision: number): void {
  const detector = duplicateGroups(data, mapping, true);
  let step = detector.next();
  while (!step.done) step = detector.next();
  for (const [criterion, groups, field] of [
    ['Filas completas iguales', step.value.metadata.equalRows.groups, ''],
    ['occurrenceID repetido', step.value.metadata.occurrenceIds.groups, 'occurrenceID'],
  ] as const) {
    for (const group of groups) {
      const description = `${criterion}: ${group.sourceRows.length} registros; primera fila ${group.sourceRows[0]}. Aviso; no se eliminan registros.`;
      for (const row of group.sourceRows) {
        if (issues.length >= LIMITS.issues) throw new Error('Se superó el límite de incidencias (100.000). Seleccione un archivo más pequeño.');
        issues.push({ field, row, description, severity: 'WARNING', context: 'system', configurationRevision: revision });
      }
    }
  }
}
