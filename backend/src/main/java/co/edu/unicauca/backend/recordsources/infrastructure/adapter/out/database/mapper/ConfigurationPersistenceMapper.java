package co.edu.unicauca.backend.recordsources.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.json.ConfigurationJson;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.json.mapper.ConfigurationJsonMapper;
import co.edu.unicauca.backend.recordsources.infrastructure.adapter.out.database.entity.ConfigurationEntity;
import java.util.List;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Mapper(config = BackendMapperConfig.class, uses = ConfigurationJsonMapper.class)
public interface ConfigurationPersistenceMapper {
    @Mapping(target = "contexts", source = "contexts", qualifiedByName = "decode")
    ValidationConfiguration toDomain(ConfigurationEntity entity, @Context ObjectMapper json);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contexts", source = "contexts", qualifiedByName = "encode")
    void replace(@MappingTarget ConfigurationEntity entity, ValidationConfiguration configuration, @Context ObjectMapper json);

    List<ContextFields> toDomain(List<ConfigurationJson.ContextFields> fields);

    @Named("encode")
    default String encode(List<ContextFields> contexts, @Context ObjectMapper json) {
        return json.writeValueAsString(contexts);
    }

    @Named("decode")
    default List<ContextFields> decode(String value, @Context ObjectMapper json) {
        // Same JSON contract as seeds and PUT bodies; legacy rows without optionalFields read as [].
        return toDomain(json.readValue(value, new TypeReference<List<ConfigurationJson.ContextFields>>() {}));
    }
}
