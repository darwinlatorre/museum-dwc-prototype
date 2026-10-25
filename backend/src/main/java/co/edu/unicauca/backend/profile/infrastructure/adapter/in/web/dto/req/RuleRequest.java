package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req;

import co.edu.unicauca.backend.profile.infrastructure.adapter.json.ProfileJson;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RuleRequest(@NotBlank @Size(max = 200) String field,
                          @NotNull ProfileJson.Kind kind,
                          @NotNull ProfileJson.Severity severity,
                          @NotNull ProfileJson.Condition condition,
                          @NotBlank @Size(max = 2000) String message,
                          @NotBlank @Size(max = 4000) String source) {}
