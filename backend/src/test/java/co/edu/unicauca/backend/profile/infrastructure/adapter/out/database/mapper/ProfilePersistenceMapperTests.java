package co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.entity.ProfileEntity;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class ProfilePersistenceMapperTests {
    private final ProfilePersistenceMapper mapper = new ProfilePersistenceMapper(JsonMapper.builder().build());

    private Profile profile(String id, String name, Profile.Status status, long revision) {
        return Profile.builder().id(id).name(name).version(" 1 ").status(status).revision(revision)
            .description(" texto Ω\n ").rules(List.of(new Profile.Rule(" county ", Profile.Kind.requiredColumn,
                Profile.Severity.WARNING, Profile.Condition.sampling, " mensaje ", " fuente "))).build();
    }

    @Test
    void roundTripPreservesEveryFieldAndJsonRuleText() {
        Profile original = profile("id", " Museo ", Profile.Status.PUBLISHED, 7);
        var entity = mapper.toEntity(original);

        assertThat(entity.getId()).isEqualTo("id");
        assertThat(entity.getName()).isEqualTo(" Museo ");
        assertThat(entity.getVersion()).isEqualTo(" 1 ");
        assertThat(entity.getStatus()).isEqualTo(ProfileEntity.Status.PUBLISHED);
        assertThat(entity.getRevision()).isEqualTo(7);
        assertThat(entity.getDescription()).isEqualTo(" texto Ω\n ");
        assertThat(mapper.toDomain(entity)).isEqualTo(original);
    }

    @Test
    void replacementUpdatesTheSameEntityAndNeverReplacesItsIdentity() {
        var managed = mapper.toEntity(profile("id", "Antes", Profile.Status.DRAFT, 0));
        Profile replacement = profile("different-id", "Después", Profile.Status.PUBLISHED, 1)
            .toBuilder().version("2").description(" descripción distinta ")
            .rules(List.of(new Profile.Rule("eventDate", Profile.Kind.date, Profile.Severity.ERROR,
                Profile.Condition.always, " fecha necesaria ", " otra fuente "))).build();
        mapper.replace(managed, replacement);

        assertThat(managed.getId()).isEqualTo("id");
        assertThat(mapper.toDomain(managed)).isEqualTo(replacement.toBuilder().id("id").build());
    }
}
