package co.edu.unicauca.backend.profile.dto.req;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateProfileRequest(@NotBlank @Size(max = 200) String name,
                                   @NotBlank @Size(max = 100) String version,
                                   @NotNull @Size(max = 10000) String description,
                                   @NotNull @Size(max = 2000) List<@NotNull @Valid RuleRequest> rules,
                                   @NotNull @PositiveOrZero Long revision) {}
