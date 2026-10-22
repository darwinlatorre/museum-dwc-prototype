import { Profile, Rule } from './analysis/model';

export const labels: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ERROR: 'Error',
  WARNING: 'Advertencia',
  required: 'Valor y columna obligatorios',
  requiredColumn: 'Solo columna obligatoria',
  date: 'Fecha del calendario',
  latitude: 'Latitud',
  longitude: 'Longitud',
  always: 'Siempre',
  collection: 'Depósito en colección',
  permit: 'Permiso',
  marine: 'Marino',
  sampling: 'Muestreo',
  permitAndCollection: 'Permiso y depósito en colección',
};
export const label = (value: string): string => labels[value] ?? value;

// Only historical, package-owned seeds qualify. User-authored text is never translated.
const seed = (profile: Profile): boolean =>
  profile.status === 'PUBLISHED' &&
  ((profile.id === '1a8373c7-9428-517b-ac5d-7ee11f18c81d' && profile.version === '4.1') ||
    (profile.id === 'ea25b7e8-9d05-5427-8e0d-c0200785fb2d' && profile.version === '1.0'));
const text: Record<string, string> = {
  'Museum-specific mandatory fields, independently versioned; these are not universal Darwin Core requirements.':
    'Campos obligatorios propios del museo, con versiones independientes; no son requisitos universales de Darwin Core.',
  'Based on official v4.1 XLSX instruction matrix (May 2024) and SiB term definitions. Select collection, permit, sampling and marine contexts explicitly. disposition and individualCount carry documented source discrepancies. Permit records also require a GGBN extension, which this core-only MVP does not validate. country must not be invented when unknown; review missing-country errors with the publisher.':
    'Basado en la matriz oficial de instrucciones XLSX v4.1 (mayo de 2024) y las definiciones de términos del SiB. Seleccione explícitamente los contextos de colección, permiso, muestreo y marino. Las fuentes presentan discrepancias documentadas sobre disposition e individualCount. Los registros con permiso también requieren una extensión GGBN, que este MVP limitado al núcleo no valida. No invente country si se desconoce; revise los errores por país faltante con el publicador.',
  'SiB matrix requests disposition here; its definition permits an empty value unless collected under permit and deposited.':
    'La matriz del SiB solicita disposition en este contexto; su definición permite un valor vacío salvo que el espécimen se haya recolectado con permiso y depositado en una colección.',
  'Document disposition (En colección) for permitted specimens deposited in a collection.':
    'Documente disposition (En colección) para especímenes recolectados con permiso y depositados en una colección.',
  'The v4.1 instruction matrix marks individualCount** but SiB version history calls it recommended; review quantity documentation.':
    'La matriz de instrucciones v4.1 marca individualCount**, pero el historial de versiones del SiB lo considera recomendado; revise la documentación sobre cantidades.',
};
export function profileDescription(profile: Profile): string {
  return seed(profile) ? (text[profile.description] ?? profile.description) : profile.description;
}
export function ruleMessage(profile: Profile, rule: Rule): string {
  if (!seed(profile)) return rule.message;
  if (rule.message === `${rule.field} is required for this context.`)
    return `${rule.field} es obligatorio en este contexto.`;
  return text[rule.message] ?? rule.message;
}

// PrimeNG 21 native translation configuration; API/enumeration values remain unchanged.
export const spanish = {
  accept: 'Aceptar',
  reject: 'Cancelar',
  choose: 'Seleccionar',
  upload: 'Cargar',
  cancel: 'Cancelar',
  emptyMessage: 'No hay resultados',
  emptyFilterMessage: 'No hay resultados',
  firstDayOfWeek: 1,
  dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  dayNamesMin: ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'],
  monthNames: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  monthNamesShort: [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ],
  today: 'Hoy',
  clear: 'Limpiar',
  dateFormat: 'dd/mm/yy',
  startsWith: 'Comienza con',
  contains: 'Contiene',
  notContains: 'No contiene',
  endsWith: 'Termina con',
  equals: 'Igual a',
  notEquals: 'Distinto de',
  noFilter: 'Sin filtro',
  lt: 'Menor que',
  lte: 'Menor o igual que',
  gt: 'Mayor que',
  gte: 'Mayor o igual que',
  is: 'Es',
  isNot: 'No es',
  before: 'Antes de',
  after: 'Después de',
  dateIs: 'La fecha es',
  dateIsNot: 'La fecha no es',
  dateBefore: 'Fecha anterior a',
  dateAfter: 'Fecha posterior a',
  apply: 'Aplicar',
  matchAll: 'Coincidir con todas',
  matchAny: 'Coincidir con alguna',
  addRule: 'Agregar regla',
  removeRule: 'Eliminar regla',
  aria: {
    firstPageLabel: 'Primera página',
    lastPageLabel: 'Última página',
    nextPageLabel: 'Página siguiente',
    prevPageLabel: 'Página anterior',
    pageLabel: 'Página {page}',
    jumpToPageDropdownLabel: 'Ir a la página',
    jumpToPageInputLabel: 'Ir a la página',
    rowsPerPageLabel: 'Filas por página',
    selectRow: 'Seleccionar fila',
    unselectRow: 'Deseleccionar fila',
    selectAll: 'Seleccionar todo',
    unselectAll: 'Deseleccionar todo',
    expandRow: 'Expandir fila',
    collapseRow: 'Contraer fila',
    showFilterMenu: 'Mostrar filtros',
    hideFilterMenu: 'Ocultar filtros',
    close: 'Cerrar',
    navigation: 'Navegación',
    scrollTop: 'Volver arriba',
  },
};
