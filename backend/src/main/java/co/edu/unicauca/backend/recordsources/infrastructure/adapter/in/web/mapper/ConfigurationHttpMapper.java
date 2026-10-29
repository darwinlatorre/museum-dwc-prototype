package co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.mapper;

import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.recordsources.application.port.in.ConfigurationUpdate;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.Context;
import java.util.stream.Collectors;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.req.UpdateConfigurationRequest;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.json.ConfigurationJson;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.res.ConfigurationResponse;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.res.ConfigurationResponse.ContextResponse;
import org.mapstruct.Mapper;

@Mapper(config = BackendMapperConfig.class)
public interface ConfigurationHttpMapper {
    default ConfigurationUpdate toCommand(UpdateConfigurationRequest request) {
        var omitted = request.contexts().stream().filter(entry -> !entry.optionalFieldsPresent())
            .map(entry -> Context.valueOf(entry.context().name())).collect(Collectors.toSet());
        return new ConfigurationUpdate(toDomain(request), omitted);
    }
    ValidationConfiguration toDomain(UpdateConfigurationRequest request);
    ContextFields toDomain(ConfigurationJson.ContextFields request);
    ConfigurationResponse toResponse(ValidationConfiguration configuration);
    ContextResponse toResponse(ContextFields fields);
}
