package co.edu.unicauca.backend.profile;

import co.edu.unicauca.backend.profile.dto.req.CreateProfileRequest;
import co.edu.unicauca.backend.profile.dto.req.RuleRequest;
import co.edu.unicauca.backend.profile.dto.req.UpdateProfileRequest;
import co.edu.unicauca.backend.profile.dto.res.ProfileResponse;
import co.edu.unicauca.backend.profile.dto.res.RuleResponse;
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

    Profile toDomain(ProfileEntity entity) {
        return new Profile(entity.getId(), entity.getName(), entity.getVersion(), entity.getStatus(), entity.getRevision(),
            entity.getDescription(), List.copyOf(json.readValue(entity.getRules(), new TypeReference<List<Profile.Rule>>() {})));
    }

    Profile.Content toContent(CreateProfileRequest request) {
        return toContent(request.name(), request.version(), request.description(), request.rules());
    }

    Profile.Content toContent(UpdateProfileRequest request) {
        return toContent(request.name(), request.version(), request.description(), request.rules());
    }

    private Profile.Content toContent(String name, String version, String description, List<RuleRequest> rules) {
        return new Profile.Content(name, version, description, rules.stream()
            .map(rule -> new Profile.Rule(rule.field(), rule.kind(), rule.severity(), rule.condition(), rule.message(), rule.source()))
            .toList());
    }

    ProfileResponse toResponse(Profile profile) {
        return new ProfileResponse(profile.id(), profile.name(), profile.version(), profile.status(), profile.revision(),
            profile.description(), profile.rules().stream()
                .map(rule -> new RuleResponse(rule.field(), rule.kind(), rule.severity(), rule.condition(), rule.message(), rule.source()))
                .toList());
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
