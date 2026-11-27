import type { ImportRequest } from '../../collections/models/collection';

/** No coercion or truncation: measure the exact JSON that HttpClient will send. */
export function assertImportLimits(body: ImportRequest): void {
  let units = 0;
  const text = (value: string, maximum: number) => {
    if (typeof value !== 'string' || value.length > maximum || value.includes(String.fromCharCode(0)) || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value))
      throw new Error('La solicitud contiene texto no admitido o supera el límite por campo. Los datos no se modificaron.');
    return value.length;
  };
  if (body.rows.length < 1 || body.rows.length > 50000 || body.headers.length < 1 || body.headers.length > 500)
    throw new Error('La importación requiere de 1 a 50.000 registros y de 1 a 500 columnas.');
  units += body.headers.reduce((sum, header) => sum + text(header, 2000), 0);
  for (const [header, field] of Object.entries(body.mapping)) { text(header, 2000); text(field, 2000); }
  const sourceRows = new Set<number>();
  for (const row of body.rows) {
    if (!Number.isInteger(row.sourceRow) || row.sourceRow < 1 || row.sourceRow > 2147483647 || sourceRows.has(row.sourceRow) || row.originalValues.length !== body.headers.length || row.values.length !== body.headers.length)
      throw new Error('Las filas de procedencia o sus columnas no son válidas. Los datos no se modificaron.');
    sourceRows.add(row.sourceRow);
    for (const value of [...row.originalValues, ...row.values]) units += text(value, 100000);
    if (units > 20 * 1024 * 1024) throw new Error('La solicitud supera 20 Mi unidades UTF-16. Seleccione un archivo más pequeño.');
  }
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 32 * 1024 * 1024)
    throw new Error('La solicitud supera 32 MiB. Seleccione un archivo más pequeño.');
}
