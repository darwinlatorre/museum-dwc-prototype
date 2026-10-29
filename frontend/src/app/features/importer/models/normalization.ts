export interface Normalization {
  trim: boolean;
  emptyMarkers: boolean;
  dates?: boolean;
  coordinates?: boolean;
  numbers?: boolean;
  duplicates?: boolean;
  dateOrder?: 'safe' | 'DMY' | 'MDY';
  decimalMode?: 'safe' | 'comma';
}
export type NormalizationKind = 'trim' | 'empty-marker' | 'date' | 'coordinate' | 'number';
export interface CellNormalization { after: string; kinds: NormalizationKind[] }
export interface Change {
  row: number;
  field: string;
  before: string;
  after: string;
}
