# Backend quality audit

Objective: remove hand-written code that duplicates Spring/Jackson/Hibernate/Lombok/MapStruct features and fix JPA/DTO/validation practices in `backend/`, preserving every public contract.
Branch: `feat/collections-management` (local commits authorized by the user on 2026-11-26; push/PR not authorized). Delivery: `ask-on-risk`. Runner: `bash ./mvnw test` (Testcontainers) plus the Python guards from AGENTS.md.

## Specs

- S1. "entres al back y verifiques la calidad del codigo"; audit report with findings.
- S2. "verifiques si hay reinvencion de cosas, es decir cosas que ya traen las librerias que estamos usando las estamos escribiendo a mano, si es asi limpia ese cosigo".
- S3. "recisa buenas practicas buena forma de descubrir los endpoints y hacer peticiones a la base de datos con los repositoriesjpa y las entidades".
- S4. "el buen uso de lombok y si validaciones se hacen y verific los builders mapers y el uso de dtos".
- S5. "limpia el codigo en el back y auditalo".
- S6. "mira si es necesario borrar pruebas incecesarias por esto mismo porque prueban cosas de reinvenvion o algo asi".
- S7. "los dtos separalos en los que son request y response".
- Constraint (AGENTS.md): HTTP status, `code`, `detail`, title and response JSON shapes stay identical; strict typing (no JSON number/boolean coercion to text) stays; no migrations; hexagonal guards stay green.

## Tasks

- T1 (S2, S4) inline: replace hand-written JSON parsers (`CollectionRequestJson`, `fromJson` delegating creators, `ConfigurationJson.fromJson`) with one strict Jackson configuration plus Bean Validation. Risk: item 3 (public API input boundary). Status: done; verifier blockers fixed (L7). Commits: b0e96a2 (recordsources + StrictJsonBeanConfig), 46f0052 (collections).
- T2 (S2, S3) inline: map `jsonb` list/map columns natively with Hibernate (`@JdbcTypeCode(SqlTypes.JSON)`), delete `CollectionJson` codec and MapStruct `java(...)` expressions. Status: done (143/143 tests, guards green). Commit: b98e7b9.
- T3 (S3) inline: JPA fixes: N+1 record counts, `merge` SELECT for assigned UUIDs (`Persistable`), repositories instead of mixed `EntityManager` writes, protected no-arg constructors. Status: done (143/143 tests, guards green). Commit: b98e7b9.
- T4 (S4, S5) inline: typed failure codes and issue severity (enums) instead of strings in collections. Status: done (143/143 tests, guards green). Commit: 46f0052.
- T5 (S3, S5) inline: small cleanups: pass-through `CatalogWebService`, `CatalogParser.hash` wrapper, `@Component` bootstrap outside BeanConfig, `@Primary` mapper workaround, test-only production overloads, missing `@Override`. Status: done (143/143 tests, guards green). Commits: a991998 (catalog), b0e96a2 (recordsources).
- T7 (S7) inline: one file per request/response DTO (`collections` containers `CollectionRequests`/`CollectionResponses`, nested `ConfigurationResponse.ContextResponse`). Status: done (144/144 across two runs, guards green). Commits: b0e96a2, 46f0052.
- T6 (S6) inline: delete tests that only exercise Lombok/MapStruct/the removed parsers. Status: done (143/143 tests, guards green). Commits: a991998, b0e96a2.

## Log

- L1 (2026-11-26, user): "a ver necesito que ahora si entres al back y verifiques la calidad del codigo, necesito que verifiques si hay reinvencion de cosas, es decir cosas que ya traen las librerias que estamos usando las estamos escribiendo a mano, si es asi limpia ese cosigo, en general recisa buenas practicas buena forma de descubrir los endpoints y hacer peticiones a la base de datos con los repositoriesjpa y las entidades el buen uso de lombok y si validaciones se hacen y verific los builders mapers y el uso de dtos, limpia el codigo en el back y auditalo, mira si es necesario borrar pruebas incecesarias por esto mismo porque prueban cosas de reinvenvion o algo asi."
- L2: Probe against jackson-databind 3.1.8 showed a mapper with scalar coercion off, float-as-int off, numbers-for-enums failing and textual coercion set to Fail rejects every coercion case pinned by `CollectionHttpTests`/`ValidationConfigurationIntegrationTests`; null list elements need `@NotNull` element constraints. Known relaxation: absent nullable properties now equal explicit `null` (base64 UUIDs were later closed, see L7).
- L4: Baseline in an isolated copy: 147 tests, 146 green; `CatalogSyncTests.officialBytesAndGenerationGuards` errored only because the copy lacked `../sources/tdwg/terms.csv` (copy layout, not code).
- L5: T1–T6 implemented; `mvnw -o compile`, `test_codegen.py`, `test_architecture.py`, `check_architecture.py` green. Docs updated: CATALOG/RECORD_SOURCES/COLLECTIONS architecture.
- L6: Full suite after change: 143 run, 0 failures/errors (147 baseline minus 4 deleted library-only tests). `mvnw package -DskipTests` and `git diff --check` green.
- L7: Independent verifier (differential MockMvc probe, 156 inputs, baseline vs current): S2 PASS, S3 PASS, S4 FAIL with two blockers: (a) `collectionId` "" or blank → 201 creating a collection (Jackson UUID blank→null), padded UUID accepted; (b) stale revision + duplicate context/field → 409 instead of 400. Probes added as regression tests (`CollectionHttpTests.strictJson…`, `ValidationConfigurationIntegrationTests.invalidShapeIsRejectedBeforeTheRevisionConflict`); RED observed (201≠400, 409≠400). Fix: canonical UUID deserializer in `StrictJsonBeanConfig`; `ConfigurationHttpMapper.toCommand` applies `ConfigurationValidation` before the use case. GREEN: 17/17 and 18/18.
- L8: Final seam run: 144 tests, 0 failures/errors; check_architecture and git diff --check green; scratch removed. Pending: commits (need explicit authorization per AGENTS.md).
- L9 (2026-11-26, user): "los dtos separalos en los que son request y response". Already split by package (`dto/req`, `dto/res`); split the grouping containers into one file per DTO; shared limits in package-private `dto/req/RequestLimits`.
- L10: T7 checks: full run exited 1 after 102 tests with 0 failures (JVM killed, host ~0 GB free while an unrelated `museum-audit` Compose project was running; not touched). Re-ran the missing classes alone: CollectionHttpTests 17, CollectionValidatorTests 4, ApiCorsTest 21, all green → 144/144 total. check_architecture and git diff --check green.
- L11 (2026-11-26, user): "prepara los commits". Work units on `feat/collections-management`, only my paths (user's staged deletions and other working-tree changes left untouched): a991998 refactor(catalog) 36+/106-; b0e96a2 refactor(recordsources) strict Jackson 167+/135- (Risk item 3); 46f0052 refactor(collections) API boundary + typed codes 274+/270- (Risk item 3); b98e7b9 refactor(collections) JSONB/JPA 109+/105-. Collections split via intermediate file versions so each commit stands alone; final tree equals the verified state. Native `gentle-ai review assess --committed-only` returned `unassessable` (untracked files in the shared working tree) with no transition: assessment unavailable, no review started; the independent verifier (L7) covered Risk item 3.
- L3: Test-first exception: T1–T5 are behavior-preserving refactors; the existing integration suites are the regression net (RED not applicable).
