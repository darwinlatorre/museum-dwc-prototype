package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req;

import static co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.RequestLimits.*;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record RestoreRequest(@NotNull @PositiveOrZero Long expectedRevision,
        @NotNull @PositiveOrZero Long configurationRevision, @NotNull @PositiveOrZero Long catalogVersion,
        @NotNull Boolean warningsConfirmed) {}
