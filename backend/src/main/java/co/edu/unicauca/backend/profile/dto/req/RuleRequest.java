package co.edu.unicauca.backend.profile.dto.req;

import co.edu.unicauca.backend.profile.Profile;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RuleRequest(@NotBlank @Size(max = 200) String field,
                          @NotNull Profile.Kind kind,
                          @NotNull Profile.Severity severity,
                          @NotNull Profile.Condition condition,
                          @NotBlank @Size(max = 2000) String message,
                          @NotBlank @Size(max = 4000) String source) {}
