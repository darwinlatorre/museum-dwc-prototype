package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res;

public record IssueResponse(String field, Integer row, String severity, String context, long configurationRevision, String description) {}
