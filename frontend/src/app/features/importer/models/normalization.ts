export interface Normalization {
  trim: boolean;
  emptyMarkers: boolean;
}
export interface Change {
  row: number;
  field: string;
  before: string;
  after: string;
}
