package co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.req;

import co.edu.unicauca.backend.recordsources.infrastructure.adapter.json.ConfigurationJson.ContextFields;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateConfigurationRequest(
        @NotNull @PositiveOrZero Long revision,
        @NotNull @Size(min = 5, max = 5) List<@NotNull @Valid ContextFields> contexts) {}
