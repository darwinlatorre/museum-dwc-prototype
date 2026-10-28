package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.mapper;

import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.ConfigurationJson;
import org.mapstruct.Mapper;

@Mapper(config = BackendMapperConfig.class)
public interface ConfigurationJsonMapper {
    ValidationConfiguration toDomain(ConfigurationJson document);
    ContextFields toDomain(ConfigurationJson.ContextFields fields);
}
