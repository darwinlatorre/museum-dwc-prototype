package co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.mapper;

import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.recordsources.application.port.in.ConfigurationUpdate;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.Context;
import java.util.stream.Collectors;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.recordsources.domain.validation.ConfigurationValidation;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.req.UpdateConfigurationRequest;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.res.ConfigurationResponse;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.in.web.dto.res.ContextResponse;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.json.mapper.ConfigurationJsonMapper;
import org.mapstruct.Mapper;

@Mapper(config = BackendMapperConfig.class, uses = ConfigurationJsonMapper.class)
public interface ConfigurationHttpMapper {
    default ConfigurationUpdate toCommand(UpdateConfigurationRequest request) {
        var configuration = toDomain(request);
        // Request shape (unique contexts/fields, combined size) is a 400 even when the revision is stale.
        ConfigurationValidation.copy(configuration);
        var omitted = request.contexts().stream().filter(entry -> !entry.optionalFieldsPresent())
            .map(entry -> Context.valueOf(entry.getContext().name())).collect(Collectors.toSet());
        return new ConfigurationUpdate(configuration, omitted);
    }
    ValidationConfiguration toDomain(UpdateConfigurationRequest request);
    ConfigurationResponse toResponse(ValidationConfiguration configuration);
    ContextResponse toResponse(ContextFields fields);
}
