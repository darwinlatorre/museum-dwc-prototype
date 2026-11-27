package co.edu.unicauca.backend.recordsources.infrastructure.adapter.json.mapper;

import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.json.ConfigurationJson;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Single owner of the JSON-to-domain mapping; HTTP and persistence mappers reuse it. */
@Mapper(config = BackendMapperConfig.class)
public interface ConfigurationJsonMapper {
    ValidationConfiguration toDomain(ConfigurationJson document);

    // Legacy stored JSON and PUT bodies without optionalFields mean an empty list.
    @Mapping(target = "optionalFields", defaultExpression = "java(java.util.List.of())")
    ContextFields toDomain(ConfigurationJson.ContextFields fields);

    List<ContextFields> toDomain(List<ConfigurationJson.ContextFields> fields);
}
