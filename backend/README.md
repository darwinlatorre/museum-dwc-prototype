# Museum profile API

Spring Boot **4.1.1**, Java **21**, PostgreSQL and Flyway. Biological files stay in the browser; this backend only administers declarative profiles and serves the catalog.

## Run locally

Start the isolated development database using the repository's `compose.mvp.yml` instructions, then from `backend/`:

```sh
bash ./mvnw spring-boot:run
```

The API binds to **127.0.0.1:8080**. Defaults connect to `jdbc:postgresql://127.0.0.1:55432/museum`, user `museum`, development-only password `museum-local-only`. Override with environment variables `DB_URL`, `DB_USER`, `DB_PASSWORD`. No dotenv file is loaded. Never point tests or development migrations at an existing institutional database.

Flyway creates the schema before startup bootstrap reads `src/main/resources/data/profiles.json`. Seed IDs are inserted once; subsequent starts never overwrite stored versions. The entire seed batch is transactional. Parent-maintained `data/catalog.json` is served unchanged in meaning, without network requests. Missing/invalid resources fail startup rather than silently providing an empty catalog.

## Endpoints

All request and response bodies are JSON; responses use the fixed integration contract.

| Method | Path | Request | Success |
| --- | --- | --- | --- |
| GET | `/api/catalog` | — | 200, `Term[]` |
| GET | `/api/profiles` | — | 200, all draft/published `Profile[]`, sorted by name/version/id |
| POST | `/api/profiles` | `{name,version,description,rules}` | 201, new draft, revision 0 |
| PUT | `/api/profiles/{id}` | `{name,version,description,rules,revision}` | 200, updated draft, revision +1 |
| POST | `/api/profiles/{id}/duplicate` | `{name,version}` | 201, independent draft with copied description/rules, revision 0 |
| POST | `/api/profiles/{id}/publish` | no body | 200, published profile, revision +1 |

`Term`: `{name,uri,definition,category,status}`.

`Profile`: `{id,name,version,status,revision,description,rules}`. IDs are server-generated UUID strings; status is `DRAFT` or `PUBLISHED`. Name and version are trimmed and their pair must be unique (case-sensitive), including drafts. Versions are explicit labels, not automatically incremented semantic versions. There is no delete endpoint: published history is permanent, and unwanted drafts remain available for editing.

`Rule`: `{field,kind,severity,condition,message,source}`:

- `kind`: `required`, `requiredColumn`, `date`, `latitude`, `longitude`.
- `severity`: `ERROR`, `WARNING`.
- `condition`: `always`, `collection`, `permit`, `marine`, `permitAndCollection`, `sampling`.
- `field`, `message`, and `source` must be nonblank. Conditions describe browser-selected context, not executable expressions. `permitAndCollection` is the conjunction of those contexts; `requiredColumn` only requires a column, unlike nonempty-value `required`.
- Empty rule arrays are allowed for new custom profiles. No script/eval or automatic universal mandatory fields exist. `county` represents municipality; no invented `municipality` requirement is added.

Example create body:

```json
{
  "name": "Research collection",
  "version": "1.0",
  "description": "Independent requirements",
  "rules": [{
    "field": "catalogNumber",
    "kind": "required",
    "severity": "ERROR",
    "condition": "collection",
    "message": "Provide a collection catalog number.",
    "source": "Museum policy"
  }]
}
```

Invalid or unknown fields/enums, null rules, blank identifiers, and missing update revisions return **400**. Rule enums require exact JSON strings; numeric ordinals are rejected. Publication requires a truly empty request body: any bytes, including an object (even `{}` or revision/rules fields), JSON `null`, a string, an array, whitespace, or malformed content, return **400** without changing the profile or its revision. Publication does not accept a revision or other content. Names/versions are limited to 200/100 characters; descriptions to 10,000; rule arrays to 2,000; rule field/message/source to 200/2,000/4,000. Missing profile IDs return **404**. Duplicate name/version pairs, stale edit revisions, repeated publication, and attempts to edit published versions return **409**, using problem JSON. Rejected writes leave versions, rules and revisions unchanged.

## Lifecycle and concurrency

The controller delegates all lifecycle operations to one transactional service. PostgreSQL row locks serialize editing and publishing the same version. Editing also compares the caller's revision, preventing stale overwrites. Publish transitions the latest locked draft; it deliberately has no request revision in the fixed contract. Two simultaneous publishers have exactly one winner. Database uniqueness resolves concurrent name/version claims atomically.

Rules are JSONB inside the profile row, so no independently mutable child rows exist. A database trigger rejects **every UPDATE or DELETE** whose old status is published, including status, revision, metadata and rule changes through direct SQL. Duplicate then edit/publish to make a new version; publication never changes another version. Database owners/superusers can disable triggers: use a restricted runtime role and a separate migration role before production deployment.

## Build and tests

Requires Java 21 and Docker access. From `backend/`:

```sh
bash ./mvnw test
bash ./mvnw package -DskipTests
```

Tests start their own disposable **PostgreSQL 17 Alpine** Testcontainers database on a random port and override datasource properties. They never use the development or existing database, never skip silently when Docker is unavailable, and cover MockMvc lifecycle operations, seeds, catalog, invalid inputs, atomic conflict rejection, simultaneous edits/creation/publication and direct-SQL immutability. Testcontainers' resource reaper disposes containers after the test JVM exits.

## Security and future boundaries

This is an unauthenticated **local development MVP**, not an internet-facing service. No permissive CORS is configured: use the frontend development proxy for `/api`. No file-upload/import or server biological-record validation endpoint exists; multipart handling is disabled.

Future Keycloak integration belongs at the HTTP boundary using Spring Security OAuth2 resource-server JWT issuer/audience validation, with explicit profile-read/profile-edit/profile-publish authorization before service invocation. Authentication, role mappings, audit attribution, HTTPS, CSRF policy for the chosen credentials, request size/rate limits, and restricted database credentials must be implemented before remote exposure. No fake authentication or trusted client identity headers are installed here. Any future secure import must use a separate bounded upload/quarantine/validation pipeline, not extend the profile payload into a file-storage API.
