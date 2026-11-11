package co.edu.unicauca.backend.collections.domain.model;

import java.util.List;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Issue;

/** Codes, not transport status or exception text, cross the core boundary. */
public final class CollectionFailure extends RuntimeException {
    private final String code;
    private final List<Issue> issues;

    public CollectionFailure(String code) { this(code, List.of()); }
    public CollectionFailure(String code, List<Issue> issues) {
        super(code);
        this.code = code;
        this.issues = List.copyOf(issues);
    }
    public String code() { return code; }
    public List<Issue> issues() { return issues; }
}
