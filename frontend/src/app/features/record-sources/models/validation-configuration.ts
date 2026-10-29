export const CONTEXTS = ['collection', 'permit', 'sampling', 'marine', 'other'] as const;
export type Context = typeof CONTEXTS[number];
export interface ContextRequirements {
  context: Context;
  requiredFields: string[];
  optionalFields?: string[];
}
export interface ValidationConfiguration {
  revision: number;
  contexts: ContextRequirements[];
}
