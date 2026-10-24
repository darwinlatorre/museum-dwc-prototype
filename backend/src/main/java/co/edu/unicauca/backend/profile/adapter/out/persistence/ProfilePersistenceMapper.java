package co.edu.unicauca.backend.profile.adapter.out.persistence;

import co.edu.unicauca.backend.profile.adapter.json.ProfileJson;
import co.edu.unicauca.backend.profile.domain.Profile;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

public class ProfilePersistenceMapper {
    private final ObjectMapper json;

    public ProfilePersistenceMapper(ObjectMapper json) {
        this.json = json;
    }

    Profile toDomain(ProfileEntity entity) {
        var rules = json.readValue(entity.getRules(), new TypeReference<java.util.List<ProfileJson.Rule>>() {});
        return new Profile(entity.getId(), entity.getName(), entity.getVersion(), entity.getStatus(), entity.getRevision(),
            entity.getDescription(), rules.stream().map(ProfileJson.Rule::toDomain).toList());
    }

    ProfileEntity toEntity(Profile profile) {
        return new ProfileEntity(profile, rules(profile));
    }

    void replace(ProfileEntity entity, Profile profile) {
        entity.replace(profile, rules(profile));
    }

    String rules(Profile profile) {
        return json.writeValueAsString(profile.rules());
    }
}
