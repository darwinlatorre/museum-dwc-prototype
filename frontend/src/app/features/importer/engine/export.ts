import type { Issue } from '../models/analysis-result';
export const jsonReport = (issues: Issue[]): string => JSON.stringify(issues, null, 2);
export function csvReport(issues: Issue[]): string {
  const fields = ['field', 'row', 'description', 'severity', 'profile', 'version'] as const;
  const safe = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return (
    fields.join(',') +
    '\r\n' +
    issues.map((issue) => fields.map((field) => safe(issue[field])).join(',')).join('\r\n')
  );
}
