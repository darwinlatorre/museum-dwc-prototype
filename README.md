# Museum biological records workbench

A first module for the Museo de Historia Natural, Universidad del Cauca. Analyze CSV/XLSX **inside the browser**, compare records against independently versioned SiB and museum profiles, download diagnostics, and manage profile drafts without editing code.

**Development MVP, not a production deployment.** Authentication and record import are intentionally not enabled. Keep both servers on loopback. The application does not certify SiB publication, taxonomy, permit compliance or GGBN extensions.

**UI licensing:** this project uses the MIT-licensed PrimeNG **21.1.10 community release** and PrimeUI themes **2.0.3**, aligned with Angular **21.2.25** (CLI/build21.2.27). It does not use commercial/LTS variants or require a PrimeUI key. The user authorized migration from the preinstalled key-required22 series; no vendor license mechanism was patched or hidden. Keep the dependency license notices when redistributing. See `frontend/node_modules/primeng/LICENSE.md` and the pinned lockfile.

**Dependency audit remains unavailable:** the original audit timed out after120s. The single fresh audit explicitly authorized by the user also timed out: `timeout 300s npm audit --json` exited124 after five minutes without output. No further retry ran. Passing tests/build and coherent versions do not establish audit clearance; accept this verification gap explicitly or obtain a completed audit from another environment before treating the delivery as closed. Full evidence: [VERIFICATION.md](VERIFICATION.md).

## Run locally

Requirements: Node.js 24+, Java 21, Docker with Compose. Maven Wrapper is included; the first Maven run needs internet access.

1. Start the isolated MVP database (does not reuse or remove an existing project's database):

   ```bash
   COMPOSE_DISABLE_ENV_FILE=true docker compose -f compose.mvp.yml up -d --wait
   ```

2. In another terminal, run Spring Boot:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. In another terminal, run Angular:

   ```bash
   cd frontend
   npm ci
   npm start
   ```

4. Open http://localhost:4200. The development proxy forwards `/api` to http://127.0.0.1:8080. Flyway creates the schema; initial startup seeds the official catalog and published `SiB Registros Biológicos 4.1` and `Museo 1.0` profiles.

The isolated database binds `127.0.0.1:55432` with database/user `museum` and development password `museum-local-only`. Override backend connection settings using `DB_URL`, `DB_USER`, `DB_PASSWORD`; do not commit real secrets. The original `docker-compose.yml` and local environment files are not required by this workflow. On systems without executable wrapper permissions, use `bash mvnw` from `backend`.

Stop the database without deleting its volume:

```bash
COMPOSE_DISABLE_ENV_FILE=true docker compose -f compose.mvp.yml stop
```

## Analyze a file

1. Select CSV or XLSX; choose the worksheet when applicable. Use the first row for headers and subsequent rows for records. Sample files are in `examples/`.
2. Choose one or more **published** profiles. Drafts cannot determine reproducible diagnostics.
3. Confirm column mappings. Unknown columns and suggested Darwin Core equivalents are not silently renamed.
4. Choose normalization deliberately and inspect its preview. Original file values remain unchanged.
5. Set the record contexts that apply: collection deposit, permit, marine and sampling. Conditions apply to this analysis batch; split heterogeneous batches when their contexts differ.
6. Run validation, filter the diagnostic table, then download the report. A missing-column issue has no record row; record issues use spreadsheet row numbers, starting at 2.

Analysis uses a dedicated Web Worker. Only profile/catalog metadata crosses the API; local filenames, cells, rows and file contents are not uploaded. A future import must be a **separate, explicitly authorized operation** with server-side revalidation.

## Manage profiles

Open the profiles workspace to create a draft, add rules, save changes, duplicate an existing version, and publish. A version is uniquely identified by its name and version string. Published rules are immutable; duplicate into a new version to change them. Stale draft edits are rejected rather than overwriting another editor's changes.

Rules use a bounded declarative schema, not executable JavaScript. They specify a term, validation type, severity, context condition, message and evidence source. See [backend API](backend/README.md) and [frontend architecture](frontend/README.md).

## Catalog and SiB evidence

The pinned TDWG catalog contains 414 entries, including imported Dublin Core terms and historical/deprecated terms. Each entry has a name, canonical URI, official definition, category and status. **Vocabulary membership does not imply mandatory data.** Mandatory fields belong to a profile.

SiB rules were checked against the actual official v4.1 workbook's instruction matrix, not just the twelve candidate fields. The museum's 22 required fields follow the requested Museo 1.0 specification independently.

Important SiB limitations:

- `disposition` and `individualCount` have discrepancies between instructions, definitions or version history. They are explicitly documented and use warnings where an unconditional rejection would be unjustified.
- Permit context also requires a GGBN extension. This MVP validates the core worksheet only and is not a substitute for reviewing that extension.
- A required but unknown `country` is a diagnostic, not permission to invent a value.

See [official evidence, attribution and licenses](sources/README.md). Rebuild and verify offline seeds:

```bash
python3 scripts/build_seeds.py
python3 scripts/test_seeds.py
```

Rebuilding resources does not edit published database versions. Publish a new version explicitly for revised requirements.

## Verify

```bash
python3 scripts/test_seeds.py
cd frontend
npm test -- --watch=false
npm run build
npm audit
cd ../backend
./mvnw test
./mvnw package -DskipTests
```

Backend integration tests use isolated PostgreSQL containers, not the development database. Check the component READMEs for runner requirements and test coverage. `odd/tasks/museum-dwc.md` records implementation evidence and any unavailable checks; a build alone does not prove browser behavior.

## Architecture and next boundary

```text
Angular / PrimeNG CRM
 ├─ TanStack Query → profile and catalog REST metadata
 └─ local file → Web Worker → parser → opt-in normalizer → validation engine
                                                  └─ diagnostics → local download
Spring Boot REST → transactional profile service → PostgreSQL
                                   Flyway schema + published-version invariants
```

Keycloak is a subsequent integration, not a simulated login screen. Before any network-facing deployment:

- Add Spring Security OAuth2 Resource Server with an issuer and audience, JWT verification and editor/publisher role enforcement. Never trust Angular guards alone.
- Add an OIDC Authorization Code + PKCE client in Angular; inject authorization into metadata requests via one API boundary, without storing tokens in file data or reports.
- Add authenticated audit identity and review CORS, CSRF strategy, TLS, request/response limits and rate limiting for the chosen deployment.
- Implement import as a separate authenticated endpoint: file limits, untrusted-content handling, pinned profile identities, authoritative backend validation and transactional persistence. A browser diagnostic must never authorize database writes.

No upload endpoint or storage of biological records exists in this MVP. Profile administration is unauthenticated and therefore **localhost-only** until Keycloak is integrated.
