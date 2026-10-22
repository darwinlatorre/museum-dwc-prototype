# MVP verification evidence

Functional checks pass, including the user-authorized MIT UI migration. Delivery closure awaits a human decision on the unavailable dependency audit: the authorized300s attempt also timed out. No audit clearance or native review approval/publication is claimed.

## Observed checks

| Check | Result |
|---|---|
| Offline seed tests | 3/3 pass; initial RED was missing seed resources |
| Backend public API, isolated PostgreSQL | 20/20 pass after correction; executable Maven package succeeds |
| Independent backend verification | Original nine tests passed; HTTP probes found two strict-input gaps |
| Backend bounded correction recheck | 11/11 pass in fresh isolated PostgreSQL; numeric enums and nonempty publication bodies reject without writes, empty-body publication succeeds |
| Frontend processing and shell tests | 49/49 pass in parent and independent verifier runs |
| Production frontend build | Pass after MIT migration; 628.86 kB initial bundle, warning above500 kB target, below unchanged1 MB failure budget |
| Installed dependency/lock coherence | After MIT migration, independent inspection confirms all21 direct dependencies match installed/lock versions and compatible peers; Angular21.2.25, build21.2.27, CDK21.2.14, PrimeNG21.1.10, themes2.0.3, TypeScript5.9.3, Vitest4.1.12. Query5.104.5/read-excel-file9.3.12 unchanged |
| Dependency audit | FAIL/unavailable: original attempt timed out120s; explicitly authorized `timeout 300s npm audit --json` exited124 at5m00s with no stdout/stderr. No automatic retry or clean claim |
| Dependency installation | Original install timed out120s. Separately authorized MIT migration: `timeout300s npm install --no-audit --no-fund` succeeded in21s; npm ls --all exits0; lock coherent. A fresh npm ci was not run |
| Native review assessment | Unassessable: provider requests an explicit declaration of remaining untracked files; no approval/acknowledgement claimed |

Nonfatal Maven metadata401 and Mockito dynamic-agent/deprecation warnings occurred. Testcontainers used disposable databases, not the project's existing database. Development PostgreSQL uses separate service `museum-db` and port55432. Existing database/volume and local environment files were not modified.

## Browser round trips

Official Chrome for Testing156, downloaded with explicit human authorization into ignored `.browser/`; named agent-browser session `museum-01a16167`.

1. **CSV errors:** `examples/records-with-errors.csv`, both published seed profiles, default contexts. Actual worker-produced diagnostic contains29 errors and1 unknown-column warning. Missing museum/SiB columns and blank scientificName row3 are attributed to their profiles; invalid eventDate row2 and coordinate bounds row2/3 are attributed to System.
2. **Downloads:** clicked JSON and CSV download buttons; both files saved. Parsed JSON and CSV each contain30 issues with field, source row, severity, message, profile and version.
3. **Locality of analysis:** HAR captured during CSV parsing/validation contains only two GET requests for the local worker bundle, no POST and no request body. This is observed proof for that workflow, not a claim that all future changes are incapable of networking.
4. **XLSX:** `examples/records.xlsx` exposed both worksheet names. Selecting `Complete` with real keyboard events, reading it and running both profiles produced zero issues. The `With errors` worksheet produces the same invalid-record diagnosis as the CSV.
5. **Configurable profiles:** created `Browser acceptance profile1.0` with a collection-conditional catalogNumber rule through GUI; published with confirmation; duplicated into1.1; edited its description through GUI. Public GET confirmed1.0 remains published/revision1/unchanged description,1.1 is draft/revision1/edited description, with independent identical rules.
6. **Catalog:** browser displays all metadata including canonical URI, official definition, class/category and current/deprecated states.
7. Browser errors list was empty during inspected CSV/XLSX workflows. The vendor license notice remained visible and was not hidden or disabled.

### Recorded failures and limits

- The delivered shell test originally failed to activate deferred content. Parent reproduced the failure, then used preloaded Query metadata and explicit Angular defer rendering; all original assertions remain and49 tests pass.
- One XLSX zero-issue wait timed out at30s because agent-browser's programmatic `select` changed the DOM value without updating the Angular field. Diagnosis showed `dom=Complete`, `model=With errors`. Real keyboard selection updated the model; the separately executed corrected input workflow passed. No production patch was made to mask a tool-level selection issue.
- The initial PrimeNG22 dependency required a key and displayed `Invalid PrimeUI License`. The human selected migration. Actual installed PrimeNG21.1.10 community and themes2.0.3 licenses grantMIT; independent license/peer/lock verification passed. Browser now has no license notice, with no suppression, key injection or vendor patch. Angular21 signal forms remain experimental.
- XLSX decompression is not streaming and occurs before row/column limits can be checked. A10MiB compressed input limit is not a memory guarantee.
- Keycloak, server biological-record validation/import and GGBN extension validation are intentionally not implemented; this is a localhost-only metadata service.

## MIT migration preservation

The user explicitly authorized migration to a compatible MIT version and one new audit capped at five minutes. That audit exhausted its bound with exit124 and no output; the remaining decision is acceptance of unavailable audit proof or obtaining completed audit evidence from another environment. The aligned stack is pinned in package.json/lock; actual package licenses were read. The only production API adaptation changes Angular's `disabled` callback syntax; the lock predicate and save guard are unchanged.

Parent reproduced the Angular21 unresolved-component-metadata test failure, then added `await TestBed.compileComponents()` without removing assertions. Parent49/49 and independent49/49 tests pass; parent production build succeeds. The independent verifier also exercised published/duplicate/draft/new form disabled states and confirmed all21 direct dependency/lock/peer entries with no mismatch.

Browser checks after migration:

- The same CSV produces30 diagnostic JSON objects **identical in content and order** to the pre-migration downloaded baseline.
- XLSX `Complete` worksheet still produces zero issues for both published seed profiles.
- Published profile metadata and every nested rule input are disabled; no save action is exposed.
- Screenshot and DOM inspection show no license banner. No vendor code was altered.

Local screenshots, downloads and HAR are in ignored `.browser/`, not in Git. The sample profile versions remain in the isolated development database as visible acceptance-test data; no cleanup deleted published history.
