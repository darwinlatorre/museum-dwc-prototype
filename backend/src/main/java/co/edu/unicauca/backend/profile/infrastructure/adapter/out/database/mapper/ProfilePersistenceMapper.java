package co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.profile.infrastructure.adapter.json.ProfileJson;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.entity.ProfileEntity;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

public class ProfilePersistenceMapper {
    private final ObjectMapper json;

    public ProfilePersistenceMapper(ObjectMapper json) {
        this.json = json;
    }

    public Profile toDomain(ProfileEntity entity) {
        var rules = json.readValue(entity.getRules(), new TypeReference<java.util.List<ProfileJson.Rule>>() {});
        return Profile.builder().id(entity.getId()).name(entity.getName()).version(entity.getVersion())
            .status(Profile.Status.valueOf(entity.getStatus().name())).revision(entity.getRevision())
            .description(entity.getDescription()).rules(rules.stream().map(ProfileJson.Rule::toDomain).toList())
            .build();
    }

    public ProfileEntity toEntity(Profile profile) {
        return new ProfileEntity(profile.id(), profile.name(), profile.version(), status(profile), profile.revision(),
            profile.description(), rules(profile));
    }

    public void replace(ProfileEntity entity, Profile profile) {
        entity.replace(profile.name(), profile.version(), status(profile), profile.revision(),
            profile.description(), rules(profile));
    }

    public ProfileEntity.Status status(Profile profile) {
        return ProfileEntity.Status.valueOf(profile.status().name());
    }

    public String rules(Profile profile) {
        return json.writeValueAsString(profile.rules());
    }
}
