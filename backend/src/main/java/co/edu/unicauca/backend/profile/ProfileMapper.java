package co.edu.unicauca.backend.profile;

import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.util.List;

@Component
class ProfileMapper {
    private final ObjectMapper json;

    ProfileMapper(ObjectMapper json) {
        this.json = json;
    }

    Profile toDto(ProfileEntity entity) {
        return new Profile(entity.id(), entity.name(), entity.version(), entity.status(), entity.revision(),
            entity.description(), List.copyOf(json.readValue(entity.rules(), new TypeReference<List<Profile.Rule>>() {})));
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
