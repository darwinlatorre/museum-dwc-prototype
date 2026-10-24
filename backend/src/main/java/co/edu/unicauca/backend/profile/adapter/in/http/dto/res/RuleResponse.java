package co.edu.unicauca.backend.profile.adapter.in.http.dto.res;

import co.edu.unicauca.backend.profile.domain.Profile;

public record RuleResponse(String field, Profile.Kind kind, Profile.Severity severity,
                           Profile.Condition condition, String message, String source) {}
