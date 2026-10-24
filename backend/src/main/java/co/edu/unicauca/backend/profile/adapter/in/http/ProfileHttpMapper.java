package co.edu.unicauca.backend.profile.adapter.in.http;

import co.edu.unicauca.backend.profile.adapter.in.http.dto.req.CreateProfileRequest;
import co.edu.unicauca.backend.profile.adapter.in.http.dto.req.RuleRequest;
import co.edu.unicauca.backend.profile.adapter.in.http.dto.req.UpdateProfileRequest;
import co.edu.unicauca.backend.profile.adapter.in.http.dto.res.ProfileResponse;
import co.edu.unicauca.backend.profile.adapter.in.http.dto.res.RuleResponse;
import co.edu.unicauca.backend.profile.domain.Profile;
import java.util.List;

public class ProfileHttpMapper {
    Profile.Content toContent(CreateProfileRequest request) {
        return toContent(request.name(), request.version(), request.description(), request.rules());
    }

    Profile.Content toContent(UpdateProfileRequest request) {
        return toContent(request.name(), request.version(), request.description(), request.rules());
    }

    private Profile.Content toContent(String name, String version, String description, List<RuleRequest> rules) {
        return new Profile.Content(name, version, description, rules.stream()
            .map(rule -> new Profile.Rule(rule.field(), Profile.Kind.valueOf(rule.kind().name()),
                Profile.Severity.valueOf(rule.severity().name()), Profile.Condition.valueOf(rule.condition().name()),
                rule.message(), rule.source())).toList());
    }

    ProfileResponse toResponse(Profile profile) {
        return new ProfileResponse(profile.id(), profile.name(), profile.version(), profile.status(), profile.revision(),
            profile.description(), profile.rules().stream()
                .map(rule -> new RuleResponse(rule.field(), rule.kind(), rule.severity(), rule.condition(), rule.message(), rule.source()))
                .toList());
    }
}
