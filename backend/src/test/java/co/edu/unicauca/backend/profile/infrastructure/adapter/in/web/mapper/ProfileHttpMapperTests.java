package co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.mapper;

import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.CreateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.RuleRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.req.UpdateProfileRequest;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res.ProfileResponse;
import co.edu.unicauca.backend.profile.infrastructure.adapter.in.web.dto.res.RuleResponse;
import co.edu.unicauca.backend.profile.infrastructure.adapter.json.ProfileJson;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileHttpMapperTests {
    private final ProfileHttpMapper mapper = Mappers.getMapper(ProfileHttpMapper.class);

    @Test
    void generatedMapperSupportsBuilderRequestsWithoutChangingTransportValues() {
        assertThat(ProfileHttpMapper.class).isInterface();
        assertThat(mapper.getClass().getSimpleName()).isEqualTo("ProfileHttpMapperImpl");
        var rule = RuleRequest.builder().field(" campo Ω ").kind(ProfileJson.Kind.required)
            .severity(ProfileJson.Severity.ERROR).condition(ProfileJson.Condition.always)
            .message(" mensaje\n ").source(" fuente ").build();
        var request = CreateProfileRequest.builder().name(" nombre ").version(" versión ")
            .description(" descripción\n ").rules(List.of(rule)).build();

        assertThat(mapper.toContent(request)).isEqualTo(new Profile.Content(" nombre ", " versión ",
            " descripción\n ", List.of(new Profile.Rule(" campo Ω ", Profile.Kind.required,
                Profile.Severity.ERROR, Profile.Condition.always, " mensaje\n ", " fuente "))));
    }

    @Test
    void bothRequestsMapWithoutTrimmingAnyInputAndKeepRevisionOutsideContent() {
        var rules = List.of(new RuleRequest(" county ", ProfileJson.Kind.requiredColumn,
            ProfileJson.Severity.WARNING, ProfileJson.Condition.sampling, " mensaje ", " fuente "));
        var expected = new Profile.Content(" Museo ", " 1 ", " texto ", List.of(new Profile.Rule(
            " county ", Profile.Kind.requiredColumn, Profile.Severity.WARNING,
            Profile.Condition.sampling, " mensaje ", " fuente ")));

        assertThat(mapper.toContent(new CreateProfileRequest(" Museo ", " 1 ", " texto ", rules)))
            .isEqualTo(expected);
        assertThat(mapper.toContent(new UpdateProfileRequest(" Museo ", " 1 ", " texto ", rules, 9L)))
            .isEqualTo(expected);
    }

    @Test
    void responseUsesTransportStringsAndPreservesAllPublicFields() {
        Profile source = Profile.builder().id("id").name("Museo").version("1")
            .status(Profile.Status.PUBLISHED).revision(7).description(" texto ")
            .rules(List.of(new Profile.Rule(" county ", Profile.Kind.requiredColumn, Profile.Severity.WARNING,
                Profile.Condition.sampling, " mensaje ", " fuente "))).build();

        assertThat(mapper.toResponse(source)).isEqualTo(new ProfileResponse("id", "Museo", "1",
            "PUBLISHED", 7, " texto ", List.of(new RuleResponse(" county ", "requiredColumn", "WARNING",
                "sampling", " mensaje ", " fuente "))));
    }
}
