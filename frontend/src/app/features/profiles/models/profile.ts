export type Condition =
  'always' | 'collection' | 'permit' | 'marine' | 'sampling' | 'permitAndCollection';
export interface Rule {
  field: string;
  kind: 'required' | 'requiredColumn' | 'date' | 'latitude' | 'longitude';
  severity: 'ERROR' | 'WARNING';
  condition: Condition;
  message: string;
  source: string;
}
export interface Profile {
  id: string;
  name: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED';
  revision: number;
  description: string;
  rules: Rule[];
}
export type ProfileInput = Pick<Profile, 'name' | 'version' | 'description' | 'rules'>;
