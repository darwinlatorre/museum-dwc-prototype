package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req;

import static co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.RequestLimits.*;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record RowRequest(@NotNull @Positive Integer sourceRow,
        @NotNull @Size(max = MAX_COLUMNS) List<@NotNull @Size(max = MAX_TEXT) String> originalValues,
        @NotNull @Size(max = MAX_COLUMNS) List<@NotNull @Size(max = MAX_TEXT) String> values) {}
