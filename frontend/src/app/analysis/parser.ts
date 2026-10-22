import { Dataset, LIMITS } from './model';

export function fromMatrix(matrix: unknown[][], rowNumbers?: number[]): Dataset {
  if (!matrix.length) throw new Error('The file has no header row.');
  const cell = (value: unknown): string =>
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');
  const headers = matrix[0].map(cell);
  if (!headers.length || headers.length > LIMITS.columns)
    throw new Error('Column limit exceeded (500).');
  const canonical = headers.map((h) => h.trim().toLowerCase());
  if (canonical.some((h) => !h) || new Set(canonical).size !== headers.length)
    throw new Error('Headers must be nonempty and unique (ignoring case and surrounding spaces).');
  const rows: Dataset['rows'] = [];
  matrix.slice(1).forEach((source, index) => {
    if (source.length > headers.length)
      throw new Error(`Too many cells at row ${rowNumbers?.[index + 1] ?? index + 2}.`);
    rows.push({
      row: rowNumbers?.[index + 1] ?? index + 2,
      values: headers.map((_, i) => cell(source[i])),
    });
  });
  if (rows.length > LIMITS.rows) throw new Error('Row limit exceeded (50,000).');
  return { headers, rows };
}

/** Strict RFC-style comma separated input. Physical record start lines survive quoted newlines. */
export function parseCsv(input: string): Dataset {
  const text = input.replace(/^\uFEFF/, '');
  if (!text) throw new Error('The file is empty.');
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
    if (matrix.length > LIMITS.rows + 1) throw new Error('Row limit exceeded (50,000).');
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
      if (record.length > LIMITS.columns) throw new Error('Column limit exceeded (500).');
    } else if (c === '\n' || c === '\r') {
      flushRow();
      if (c === '\r' && text[i + 1] === '\n') i++;
      line++;
      start = line;
    } else if (c === '"') {
      if (value || closed) throw new Error(`Malformed quote at row ${line}.`);
      quoted = true;
      touched = true;
    } else {
      if (closed) throw new Error(`Unexpected text after quote at row ${line}.`);
      value += c;
      touched = true;
    }
  }
  if (quoted) throw new Error('Unclosed quoted CSV field.');
  if (touched || record.length || value) flushRow();
  // CSV is rectangular, unlike sparse spreadsheet rows.
  if (matrix.some((row) => row.length !== matrix[0].length))
    throw new Error('CSV rows must have the same number of cells as the header.');
  return fromMatrix(matrix, lines);
}
