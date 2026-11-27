/** Mapas para I18nPluralPipe: concordancia en español sin condicionales en plantillas. */
export const PLURALS = {
  error: { '=1': '# error', other: '# errores' },
  warning: { '=1': '# advertencia', other: '# advertencias' },
  record: { '=1': '# registro', other: '# registros' },
  column: { '=1': '# columna', other: '# columnas' },
  collection: { '=1': '# colección', other: '# colecciones' },
  normalized: { '=1': '# valor normalizado', other: '# valores normalizados' },
  field: { '=1': '# campo', other: '# campos' },
  required: { '=1': '# obligatorio', other: '# obligatorios' },
  optional: { '=1': '# opcional', other: '# opcionales' },
  missingRecord: { '=1': '# registro sin datos', other: '# registros sin datos' },
} as const;
