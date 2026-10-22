# MVP verification evidence

Functional checks pass; final delivery is **pending the PrimeUI license decision and unavailable dependency audit clearance**. No native review approval or publication is claimed.

## Observed checks

| Check | Result |
|---|---|
| Offline seed tests | 3/3 pass; initial RED was missing seed resources |
| Backend public API, isolated PostgreSQL | 20/20 pass after correction; executable Maven package succeeds |
| Independent backend verification | Original nine tests passed; HTTP probes found two strict-input gaps |
| Backend bounded correction recheck | 11/11 pass in fresh isolated PostgreSQL; numeric enums and nonempty publication bodies reject without writes, empty-body publication succeeds |
| Frontend processing and shell tests | 49/49 pass in parent and independent verifier runs |
| Production frontend build | Pass; 693.41 kB initial bundle, warning above 500 kB target, below unchanged 1 MB failure budget |
| Installed dependency/lock coherence | Independent inspection confirms read-excel-file9.3.12, Vite8.3.5 and Angular build22.2.3 match locked versions and integrity entries |
| Dependency audit | Unavailable: `npm audit` timed out after120s; not retried or reported clean |
| Dependency installation | Worker `npm install` timed out after120s; existing installed packages and lock were inspected, not a successful clean-install proof |
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
- PrimeNG22's installed license requires a valid key, including community usage. Without one it displays `Invalid PrimeUI License`. A human must select a valid-license path or explicitly approve a compatible MIT-version migration. No license key was invented or mechanism bypassed.
- XLSX decompression is not streaming and occurs before row/column limits can be checked. A10MiB compressed input limit is not a memory guarantee.
- Keycloak, server biological-record validation/import and GGBN extension validation are intentionally not implemented; this is a localhost-only metadata service.

Local screenshots, downloads and HAR are in ignored `.browser/`, not in Git. The sample profile versions remain in the isolated development database as visible acceptance-test data; no cleanup deleted published history.
