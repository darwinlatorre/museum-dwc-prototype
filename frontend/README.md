# Museum collection workbench

Angular 22, PrimeNG 22 and TanStack Query 5 provide a local-file data quality workbench. The API stores catalog and versioned profile metadata only. File bytes and record values never go to the API.

## Run

From `frontend/`, run `npm ci` then `npm start`. Open http://localhost:4200. The development server proxies `/api` to http://localhost:8080; start the backend first. Run `npm test -- --watch=false` and `npm run build` for verification. Production hosting must serve `dist/frontend/browser` and reverse-proxy `/api` to the backend on the same origin. Use a trusted local environment: authentication is not implemented or simulated; the metadata API can later sit behind an OIDC/Keycloak boundary.

## Analyze a collection

1. Select UTF-8 comma-separated CSV or XLSX. Choose a worksheet explicitly for XLSX.
2. Choose one or more published profiles. Drafts cannot run.
3. Map headers to Darwin Core fields. Exact names work without mapping; suggested equivalences require a click or typed confirmation. Duplicate targets are rejected.
4. Optionally trim surrounding whitespace and/or treat `NULL` and `N/A` as empty. Review the first 20 records' changes. Both options default off. Only a working copy changes.
5. Declare collection, permit, marine and sampling context, then validate locally. `permitAndCollection` requires both booleans.
6. Filter and paginate the diagnostic; download all issues as JSON or CSV. Downloads retain field, original source row, description, severity, profile and version. CSV cells beginning with spreadsheet formula triggers are prefixed with an apostrophe.

Limits: 10 MiB input, 50,000 data rows, 500 columns, 100,000 issues. Malformed quoting, inconsistent CSV widths, empty headers and case/space-equivalent duplicate headers are rejected. CSV source rows count physical lines, including multiline quoted fields and blank lines. XLSX source rows refer to worksheet positions. Spreadsheet date cells become ISO calendar dates for validation. Sparse spreadsheet rows are padded, never shifted. Terminate processing with **Cancel processing**; changes to mappings, selected profiles, normalization, context or refreshed metadata invalidate previous diagnostics. Processing is single-file, one worksheet at a time. XLSX decompression is not streaming: compressed workbooks may consume more memory than their input size; cancel or choose a smaller CSV if needed.

Basic integrity checks always validate populated `eventDate` as exact `YYYY-MM-DD`, populated year/month/day as integer calendar components (including leap years and cross-field consistency), and decimal coordinates as finite numbers in ±90/±180. Empty optional values are allowed. Profile rules decide column and value requirements; `requiredColumn` never requires a nonblank cell. Unknown columns generate system warnings with possible equivalences. Diagnostics are quality guidance, not SiB certification. Extension-specific validations beyond the configured rule kinds are outside this MVP.

## Manage profiles

Create a profile and add field, check, condition, severity, message and evidence/source rules. Save a draft, edit it, or publish it explicitly. Published versions are read-only: duplicate them with a new version to evolve rules. Changes are persisted only after successful API responses. API errors remain visible; no local persistence or fake success replaces a failed request. Concurrent changes are rejected by the backend using `revision`; reload server state before retrying.

API contract: `GET /api/catalog`, `GET /api/profiles`, `POST /api/profiles`, `PUT /api/profiles/{id}`, `POST /api/profiles/{id}/duplicate` with `{name,version}`, and `POST /api/profiles/{id}/publish`. Create bodies contain `{name,version,description,rules}`; updates additionally send `revision`. No file upload endpoint is used.

## Architecture

- `analysis/model.ts`: shared UI/worker/profile contract and bounded limits.
- `analysis/parser.ts`: strict CSV and spreadsheet matrix conversion.
- `analysis/normalizer.ts`: immutable opt-in transformations with change records.
- `analysis/validator.ts`: independent profile rules and baseline integrity checks.
- `analysis/analysis.worker.ts`: local XLSX/CSV parsing and validation, cancelled by terminating the worker; generation IDs suppress stale responses.
- `analysis/export.ts`: JSON and formula-neutralized CSV diagnostics.
- `api.ts`: metadata-only boundary; TanStack Query manages server reads, mutation invalidation and errors.

The narrow `@angular/build` Vite override keeps Vite on the patched 8.3.x-compatible line without changing Angular or adding parser dependencies.
