package co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.profile.infrastructure.adapter.json.ProfileJson;
import co.edu.unicauca.backend.profile.infrastructure.adapter.json.mapper.ProfileJsonMapper;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.entity.ProfileEntity;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import java.util.List;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Mapper(config = BackendMapperConfig.class)
public interface ProfilePersistenceMapper extends ProfileJsonMapper {
    @Mapping(target = "rules", source = "rules", qualifiedByName = "decodeRules")
    Profile toDomain(ProfileEntity entity, @Context ObjectMapper json);

    @Mapping(target = "rules", source = "rules", qualifiedByName = "encodeRules")
    ProfileEntity toEntity(Profile profile, @Context ObjectMapper json);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rules", source = "rules", qualifiedByName = "encodeRules")
    void replace(@MappingTarget ProfileEntity entity, Profile profile, @Context ObjectMapper json);

    ProfileEntity.Status status(Profile.Status status);

    default String rules(Profile profile, @Context ObjectMapper json) {
        return encodeRules(profile.rules(), json);
    }

    @Named("decodeRules")
    default List<Profile.Rule> decodeRules(String value, @Context ObjectMapper json) {
        List<ProfileJson.Rule> rules = json.readValue(value, new TypeReference<List<ProfileJson.Rule>>() {});
        return toDomainRules(rules);
    }

    @Named("encodeRules")
    default String encodeRules(List<Profile.Rule> rules, @Context ObjectMapper json) {
        return json.writeValueAsString(rules);
    }
}
