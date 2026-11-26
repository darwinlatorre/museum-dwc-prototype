package co.edu.unicauca.backend.collections.domain.model;

import java.util.List;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Issue;

/** Codes, not transport status or exception text, cross the core boundary. */
public final class CollectionFailure extends RuntimeException {
    public enum Code {
        INVALID_REQUEST, INVALID_MAPPING, INVALID_PAGING, PAYLOAD_TOO_LARGE, TOO_MANY_ISSUES, NOT_FOUND,
        AUTHORITY_UNAVAILABLE, CONFIGURATION_CHANGED, CATALOG_CHANGED, REVISION_CONFLICT, CONTEXT_CONFLICT,
        IDEMPOTENCY_CONFLICT, DUPLICATE, VALIDATION_FAILED, WARNINGS_UNCONFIRMED, RECORD_TRASHED, RECORD_ACTIVE
    }

    private final Code code;
    private final List<Issue> issues;

    public CollectionFailure(Code code) { this(code, List.of()); }
    public CollectionFailure(Code code, List<Issue> issues) {
        super(code.name());
        this.code = code;
        this.issues = List.copyOf(issues);
    }
    public Code code() { return code; }
    public List<Issue> issues() { return issues; }
}
