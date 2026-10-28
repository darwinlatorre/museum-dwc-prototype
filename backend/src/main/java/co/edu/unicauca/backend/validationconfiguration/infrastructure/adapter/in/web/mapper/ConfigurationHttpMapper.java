package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.mapper;

import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.dto.req.UpdateConfigurationRequest;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.ConfigurationJson;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.dto.res.ConfigurationResponse;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.dto.res.ConfigurationResponse.ContextResponse;
import org.mapstruct.Mapper;

@Mapper(config = BackendMapperConfig.class)
public interface ConfigurationHttpMapper {
    ValidationConfiguration toDomain(UpdateConfigurationRequest request);
    ContextFields toDomain(ConfigurationJson.ContextFields request);
    ConfigurationResponse toResponse(ValidationConfiguration configuration);
    ContextResponse toResponse(ContextFields fields);
}
