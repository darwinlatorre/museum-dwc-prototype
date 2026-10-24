package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.mapper;

import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.CreateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.RuleRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.UpdateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res.ProfileResponse;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res.RuleResponse;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import java.util.List;

public class ProfileHttpMapper {
    public Profile.Content toContent(CreateProfileRequest request) {
        return toContent(request.name(), request.version(), request.description(), request.rules());
    }

    public Profile.Content toContent(UpdateProfileRequest request) {
        return toContent(request.name(), request.version(), request.description(), request.rules());
    }

    private Profile.Content toContent(String name, String version, String description, List<RuleRequest> rules) {
        return new Profile.Content(name, version, description, rules.stream()
            .map(rule -> new Profile.Rule(rule.field(), Profile.Kind.valueOf(rule.kind().name()),
                Profile.Severity.valueOf(rule.severity().name()), Profile.Condition.valueOf(rule.condition().name()),
                rule.message(), rule.source())).toList());
    }

    public ProfileResponse toResponse(Profile profile) {
        return new ProfileResponse(profile.id(), profile.name(), profile.version(), profile.status().name(), profile.revision(),
            profile.description(), profile.rules().stream()
                .map(rule -> new RuleResponse(rule.field(), rule.kind().name(), rule.severity().name(),
                    rule.condition().name(), rule.message(), rule.source()))
                .toList());
    }
}
