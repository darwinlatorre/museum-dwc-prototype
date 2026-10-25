package co.edu.unicauca.backend.profile.infrastructure.adapter.json.mapper;

import co.edu.unicauca.backend.profile.domain.exception.ProfileValidationException;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.profile.domain.validation.ProfileValidation;
import co.edu.unicauca.backend.profile.infrastructure.adapter.json.ProfileJson;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProfileJsonMapperTests {
    private final ProfileJsonMapper mapper = Mappers.getMapper(ProfileJsonMapper.class);
    private final ObjectMapper json = JsonMapper.builder().build();

    @Test
    void generatedSeedMappingPreservesEveryFieldAndArbitraryText() {
        var rule = ProfileJson.Rule.builder().field(" county Ω ").kind(ProfileJson.Kind.requiredColumn)
            .severity(ProfileJson.Severity.WARNING).condition(ProfileJson.Condition.sampling)
            .message(" mensaje\n ").source(" fuente ").build();
        var seed = ProfileJson.Seed.builder().id(" id ").name(" Museo ").version(" 1 ")
            .status(Profile.Status.PUBLISHED).revision(7).description(" descripción\n ")
            .rules(List.of(rule)).build();

        assertThat(ProfileJsonMapper.class).isInterface();
        assertThat(mapper.getClass().getSimpleName()).isEqualTo("ProfileJsonMapperImpl");
        assertThat(mapper.toDomain(seed)).isEqualTo(new Profile(" id ", " Museo ", " 1 ",
            Profile.Status.PUBLISHED, 7, " descripción\n ", List.of(new Profile.Rule(" county Ω ",
                Profile.Kind.requiredColumn, Profile.Severity.WARNING, Profile.Condition.sampling,
                " mensaje\n ", " fuente "))));
    }

    @Test
    void nullListsAndNullRulesReachDomainValidationWithoutBeingDropped() {
        var absent = new ProfileJson.Seed("id", "Museo", "1", Profile.Status.PUBLISHED, 0, "", null);
        var containingNull = new ProfileJson.Seed("id", "Museo", "1", Profile.Status.PUBLISHED, 0,
            "", Arrays.asList((ProfileJson.Rule) null));
        Profile missingRules = mapper.toDomain(absent);
        Profile invalidRules = mapper.toDomain(containingNull);

        assertThat(missingRules.rules()).isNull();
        assertThat(invalidRules.rules()).containsExactly((Profile.Rule) null);
        for (Profile profile : List.of(missingRules, invalidRules)) {
            assertThatThrownBy(() -> ProfileValidation.validate(new Profile.Content(profile.name(),
                profile.version(), profile.description(), profile.rules())))
                .isInstanceOf(ProfileValidationException.class);
        }
        assertThat(mapper.toDomain((ProfileJson.Rule) null)).isNull();
        assertThat(mapper.toDomain(ProfileJson.Rule.builder().field(" campo ").build()))
            .isEqualTo(new Profile.Rule(" campo ", null, null, null, null, null));
    }

    @Test
    void everyJsonEnumMapsByItsUnchangedOfficialName() {
        for (ProfileJson.Kind kind : ProfileJson.Kind.values()) {
            for (ProfileJson.Severity severity : ProfileJson.Severity.values()) {
                for (ProfileJson.Condition condition : ProfileJson.Condition.values()) {
                    var rule = new ProfileJson.Rule(" campo ", kind, severity, condition, " mensaje ", " fuente ");
                    assertThat(mapper.toDomain(rule)).isEqualTo(new Profile.Rule(" campo ",
                        Profile.Kind.valueOf(kind.name()), Profile.Severity.valueOf(severity.name()),
                        Profile.Condition.valueOf(condition.name()), " mensaje ", " fuente "));
                }
            }
        }
    }

    @Test
    void strictJsonCreatorsStillRejectNonStringAndUnknownEnumTokens() {
        for (String token : List.of("0", "true", "\"unknown\"")) {
            for (String field : List.of("kind", "severity", "condition")) {
                assertThatThrownBy(() -> json.readValue("{\"" + field + "\":" + token + "}", ProfileJson.Rule.class))
                    .isInstanceOf(RuntimeException.class);
            }
        }
        assertThat(json.readValue("{\"kind\":\"date\",\"severity\":\"ERROR\",\"condition\":\"always\"}",
            ProfileJson.Rule.class)).isEqualTo(new ProfileJson.Rule(null, ProfileJson.Kind.date,
                ProfileJson.Severity.ERROR, ProfileJson.Condition.always, null, null));
    }
}
