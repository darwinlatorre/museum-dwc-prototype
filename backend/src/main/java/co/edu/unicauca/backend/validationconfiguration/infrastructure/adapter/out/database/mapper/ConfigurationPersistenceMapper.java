package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.ConfigurationJson;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.json.mapper.ConfigurationJsonMapper;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.entity.ConfigurationEntity;
import java.util.List;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import tools.jackson.databind.ObjectMapper;

@Mapper(config = BackendMapperConfig.class)
public interface ConfigurationPersistenceMapper extends ConfigurationJsonMapper {
    @Mapping(target = "contexts", source = "contexts", qualifiedByName = "decode")
    ValidationConfiguration toDomain(ConfigurationEntity entity, @Context ObjectMapper json);

    @Mapping(target = "id", constant = "1")
    @Mapping(target = "contexts", source = "contexts", qualifiedByName = "encode")
    ConfigurationEntity toEntity(ValidationConfiguration configuration, @Context ObjectMapper json);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contexts", source = "contexts", qualifiedByName = "encode")
    void replace(@MappingTarget ConfigurationEntity entity, ValidationConfiguration configuration, @Context ObjectMapper json);

    @Named("encode")
    default String encode(List<ContextFields> contexts, @Context ObjectMapper json) {
        return json.writeValueAsString(contexts);
    }

    @Named("decode")
    default List<ContextFields> decode(String value, @Context ObjectMapper json) {
        // Reuse the same strict JSON boundary for seeds and durable metadata.
        var document = ConfigurationJson.fromJson(json.readTree("{\"revision\":0,\"contexts\":" + value + "}"));
        return toDomain(document).contexts();
    }
}
