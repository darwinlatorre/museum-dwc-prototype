import readXlsxFile from 'read-excel-file/web-worker';
import { LIMITS, WorkerRequest, WorkerResponse } from './model';
import { fromMatrix, parseCsv } from './parser';
import { normalize } from './normalizer';
import { validate } from './validator';

addEventListener('message', async ({ data: request }: MessageEvent<WorkerRequest>) => {
  const reply = (message: WorkerResponse) => postMessage(message);
  try {
    if (request.kind === 'parse') {
      if (request.file.size > LIMITS.bytes) throw new Error('File limit exceeded (10 MiB).');
      if (/\.csv$/i.test(request.file.name))
        reply({ id: request.id, kind: 'parsed', data: parseCsv(await request.file.text()) });
      else if (/\.xlsx$/i.test(request.file.name)) {
        const sheets = await readXlsxFile(await request.file.arrayBuffer(), { trim: false });
        if (!request.sheet)
          reply({ id: request.id, kind: 'sheets', sheets: sheets.map((s) => s.sheet) });
        else {
          const selected = sheets.find((s) => s.sheet === request.sheet);
          if (!selected) throw new Error('Select an available worksheet.');
          reply({ id: request.id, kind: 'parsed', data: fromMatrix(selected.data) });
        }
      } else throw new Error('Select a CSV or XLSX file.');
    } else {
      const normalized = normalize(request.data, request.options);
      reply({
        id: request.id,
        kind: 'result',
        issues: validate(
          normalized.data,
          request.mapping,
          request.profiles,
          request.terms,
          request.context,
        ),
        changes: normalized.changes,
      });
    }
  } catch (error) {
    reply({
      id: request.id,
      kind: 'error',
      message: error instanceof Error ? error.message : 'Local processing failed.',
    });
  }
});
