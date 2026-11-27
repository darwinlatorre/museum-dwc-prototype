package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req;

import static co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.RequestLimits.*;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record EditRequest(@NotNull @PositiveOrZero Long expectedRevision,
        @NotNull @PositiveOrZero Long configurationRevision, @NotNull @PositiveOrZero Long catalogVersion,
        @NotNull Boolean warningsConfirmed,
        @NotNull @Size(max = MAX_COLUMNS) List<@NotNull @Size(max = MAX_TEXT) String> values) {}
