import readXlsxFile from 'read-excel-file/web-worker';
import { LIMITS } from '../models/dataset';
import type { WorkerRequest, WorkerResponse } from '../models/worker-protocol';
import { fromMatrix, parseCsv } from './parser';
import { normalize } from './normalizer';
import { validate } from './validator';
import { appendDuplicateWarnings, duplicateGroups } from './normalization-duplicates';
import type { Dataset } from '../models/dataset';

let original: Dataset | undefined;
let current: Dataset | undefined;
let session = 0;
let generation = 0;

addEventListener('message', async ({ data: request }: MessageEvent<WorkerRequest>) => {
  const reply = (message: WorkerResponse) => postMessage(message);
  try {
    if (request.kind === 'parse') {
      if (request.file.size > LIMITS.bytes)
        throw new Error('Se superó el límite del archivo (10 MiB).');
      if (/\.csv$/i.test(request.file.name))
        reply({ id: request.id, kind: 'parsed', data: parseCsv(await request.file.text()) });
      else if (/\.xlsx$/i.test(request.file.name)) {
        const sheets = await readXlsxFile(await request.file.arrayBuffer(), { trim: false }).catch(
          () => {
            throw new Error(
              'No se pudo leer el archivo XLSX. Verifique que sea válido y no esté protegido.',
            );
          },
        );
        if (!request.sheet)
          reply({ id: request.id, kind: 'sheets', sheets: sheets.map((s) => s.sheet) });
        else {
          const selected = sheets.find((s) => s.sheet === request.sheet);
          if (!selected) throw new Error('Seleccione una hoja disponible.');
          reply({ id: request.id, kind: 'parsed', data: fromMatrix(selected.data) });
        }
      } else throw new Error('Seleccione un archivo CSV o XLSX.');
    } else if (request.kind === 'dispose') {
      if (request.session !== session) throw new Error('La sesión de análisis ya no está vigente.');
      original = current = undefined;
    } else if (request.kind === 'prepare') {
      if (!original || !current || request.session !== session || request.generation !== generation)
        throw new Error('La sesión de análisis ya no está vigente.');
      if (!Number.isSafeInteger(request.offset) || request.offset < 0 || request.offset >= current.rows.length)
        throw new Error('La ventana de preparación no es válida.');
      // Pull-based pages bound BOTH rows and text, including very wide source rows.
      const rows = [];
      let units = 0;
      for (let i = request.offset; i < current.rows.length && rows.length < 256; i++) {
        const source = original.rows[i], row = current.rows[i];
        const size = [...source.values, ...row.values].reduce((sum, value) => sum + value.length, 0);
        if (rows.length && units + size > 256 * 1024) break;
        rows.push({ sourceRow: source.row, originalValues: source.values, values: row.values });
        units += size;
      }
      reply({ id: request.id, session, generation, kind: 'prepared', offset: request.offset, rows,
        done: request.offset + rows.length === current.rows.length });
    } else {
      if (!Number.isSafeInteger(request.session) || !Number.isSafeInteger(request.generation) || request.session < 1 || request.generation < 1 ||
        (original && (request.session !== session || request.generation <= generation)))
        throw new Error('La sesión de análisis ya no está vigente.');
      if (!original) {
        if (!request.data) throw new Error('No hay datos originales para analizar.');
        original = request.data;
        session = request.session;
      }
      generation = request.generation;
      current = undefined;
      const normalized = normalize(original, request.options, request.mapping);
      const issues = validate(normalized.data, request.mapping, request.configuration, request.terms, request.context);
      if (request.options.duplicates) appendDuplicateWarnings(issues, normalized.data, request.mapping, request.configuration.revision);
      const detector = duplicateGroups(normalized.data, request.mapping, true);
      let step = detector.next();
      while (!step.done) step = detector.next();
      const counts = (group: typeof step.value.metadata.equalRows) => ({ groups: group.groups.length, affectedRows: group.affectedRows });
      const duplicates = { equalRows: counts(step.value.metadata.equalRows), occurrenceIds: counts(step.value.metadata.occurrenceIds) };
      current = normalized.data;
      reply({ id: request.id, session, generation, kind: 'result', issues, changes: normalized.changes, duplicates });
    }
  } catch (error) {
    reply({
      id: request.id,
      kind: 'error',
      ...('session' in request ? { session: request.session, generation: request.generation } : {}),
      message:
        error instanceof Error ? error.message : 'No se pudo completar el procesamiento local.',
    });
  }
});
