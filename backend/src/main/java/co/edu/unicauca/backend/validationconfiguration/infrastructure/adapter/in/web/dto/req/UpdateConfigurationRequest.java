package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.dto.req;

import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.ConfigurationJson;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.ConfigurationJson.ContextFields;
import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;
import tools.jackson.databind.JsonNode;

public record UpdateConfigurationRequest(
        @NotNull @PositiveOrZero Long revision,
        @NotNull @Size(min = 5, max = 5) List<@NotNull @Valid ContextFields> contexts) {
    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static UpdateConfigurationRequest fromJson(JsonNode value) {
        var document = ConfigurationJson.fromJson(value);
        return new UpdateConfigurationRequest(document.revision(), document.contexts());
    }
}
