package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req;

import static co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.RequestLimits.*;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record AddRequest(@NotNull @PositiveOrZero Long expectedRevision,
        @NotNull @PositiveOrZero Long configurationRevision, @NotNull @PositiveOrZero Long catalogVersion,
        @NotNull Boolean warningsConfirmed,
        @NotNull @Size(min = 1, max = MAX_COLUMNS) List<@NotNull @Size(max = MAX_TEXT) String> headers,
        @NotNull @Size(max = MAX_COLUMNS) Map<String, @NotNull @Size(max = MAX_TEXT) String> mapping,
        @NotNull @Valid RowRequest row) {}
