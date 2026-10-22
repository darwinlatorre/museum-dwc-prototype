import { Dataset, LIMITS } from './model';

export function fromMatrix(matrix: unknown[][], rowNumbers?: number[]): Dataset {
  if (!matrix.length) throw new Error('El archivo no tiene una fila de encabezados.');
  const cell = (value: unknown): string =>
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');
  const headers = matrix[0].map(cell);
  if (!headers.length || headers.length > LIMITS.columns)
    throw new Error('Se superó el límite de columnas (500).');
  const canonical = headers.map((h) => h.trim().toLowerCase());
  if (canonical.some((h) => !h) || new Set(canonical).size !== headers.length)
    throw new Error(
      'Los encabezados deben ser únicos y no estar vacíos (sin distinguir mayúsculas ni espacios al inicio o al final).',
    );
  const rows: Dataset['rows'] = [];
  matrix.slice(1).forEach((source, index) => {
    if (source.length > headers.length)
      throw new Error(`Demasiadas celdas en la fila ${rowNumbers?.[index + 1] ?? index + 2}.`);
    rows.push({
      row: rowNumbers?.[index + 1] ?? index + 2,
      values: headers.map((_, i) => cell(source[i])),
    });
  });
  if (rows.length > LIMITS.rows) throw new Error('Se superó el límite de filas (50.000).');
  return { headers, rows };
}

/** Strict RFC-style comma separated input. Physical record start lines survive quoted newlines. */
export function parseCsv(input: string): Dataset {
  const text = input.replace(/^\uFEFF/, '');
  if (!text) throw new Error('El archivo está vacío.');
  const matrix: string[][] = [],
    lines: number[] = [];
  let record: string[] = [],
    value = '',
    quoted = false,
    closed = false,
    line = 1,
    start = 1,
    touched = false;
  const flushCell = () => {
    record.push(value);
    value = '';
    closed = false;
  };
  const flushRow = () => {
    flushCell();
    if (touched || record.length > 1) {
      matrix.push(record);
      lines.push(start);
    }
    record = [];
    touched = false;
    if (matrix.length > LIMITS.rows + 1) throw new Error('Se superó el límite de filas (50.000).');
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        value += c;
        if (c === '\n' || (c === '\r' && text[i + 1] !== '\n')) line++;
      }
      continue;
    }
    if (c === ',') {
      flushCell();
      touched = true;
      if (record.length > LIMITS.columns) throw new Error('Se superó el límite de columnas (500).');
    } else if (c === '\n' || c === '\r') {
      flushRow();
      if (c === '\r' && text[i + 1] === '\n') i++;
      line++;
      start = line;
    } else if (c === '"') {
      if (value || closed) throw new Error(`Comillas mal formadas en la fila ${line}.`);
      quoted = true;
      touched = true;
    } else {
      if (closed) throw new Error(`Texto inesperado después de las comillas en la fila ${line}.`);
      value += c;
      touched = true;
    }
  }
  if (quoted) throw new Error('Campo CSV con comillas sin cerrar.');
  if (touched || record.length || value) flushRow();
  // CSV is rectangular, unlike sparse spreadsheet rows.
  if (matrix.some((row) => row.length !== matrix[0].length))
    throw new Error('Las filas del CSV deben tener el mismo número de celdas que el encabezado.');
  return fromMatrix(matrix, lines);
}
