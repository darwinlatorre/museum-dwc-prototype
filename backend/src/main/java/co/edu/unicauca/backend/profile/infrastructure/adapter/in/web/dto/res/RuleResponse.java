package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res;

public record RuleResponse(String field, String kind, String severity,
                           String condition, String message, String source) {}
