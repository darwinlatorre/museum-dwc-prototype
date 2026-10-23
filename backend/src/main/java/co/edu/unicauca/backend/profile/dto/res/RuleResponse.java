package co.edu.unicauca.backend.profile.dto.res;

import co.edu.unicauca.backend.profile.Profile;

public record RuleResponse(String field, Profile.Kind kind, Profile.Severity severity,
                           Profile.Condition condition, String message, String source) {}
