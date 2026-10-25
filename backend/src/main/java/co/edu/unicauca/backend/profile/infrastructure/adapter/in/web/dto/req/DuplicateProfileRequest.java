package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DuplicateProfileRequest(@NotBlank @Size(max = 200) String name,
                                      @NotBlank @Size(max = 100) String version) {}
