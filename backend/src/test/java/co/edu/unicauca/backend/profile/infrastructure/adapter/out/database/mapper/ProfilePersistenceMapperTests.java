package co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.entity.ProfileEntity;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class ProfilePersistenceMapperTests {
    private final ProfilePersistenceMapper mapper = Mappers.getMapper(ProfilePersistenceMapper.class);
    private final ObjectMapper json = JsonMapper.builder().build();

    @Test
    void generatedMapperRetainsSeedHelpersAndExplicitCodecContext() {
        assertThat(ProfilePersistenceMapper.class).isInterface();
        assertThat(mapper.getClass().getSimpleName()).isEqualTo("ProfilePersistenceMapperImpl");
        Profile source = profile(" seed-id ", " Museo Ω ", Profile.Status.PUBLISHED, 0);
        assertThat(mapper.status(source.status())).isEqualTo(ProfileEntity.Status.PUBLISHED);
        assertThat(mapper.rules(source, json)).isEqualTo(json.writeValueAsString(source.rules()));
        ObjectMapper otherContext = JsonMapper.builder().build();
        assertThat(mapper.toDomain(mapper.toEntity(source, otherContext), otherContext)).isEqualTo(source);
    }

    private Profile profile(String id, String name, Profile.Status status, long revision) {
        return Profile.builder().id(id).name(name).version(" 1 ").status(status).revision(revision)
            .description(" texto Ω\n ").rules(List.of(new Profile.Rule(" county ", Profile.Kind.requiredColumn,
                Profile.Severity.WARNING, Profile.Condition.sampling, " mensaje ", " fuente "))).build();
    }

    @Test
    void roundTripPreservesEveryFieldAndJsonRuleText() {
        Profile original = profile("id", " Museo ", Profile.Status.PUBLISHED, 7);
        var entity = mapper.toEntity(original, json);

        assertThat(entity.getId()).isEqualTo("id");
        assertThat(entity.getName()).isEqualTo(" Museo ");
        assertThat(entity.getVersion()).isEqualTo(" 1 ");
        assertThat(entity.getStatus()).isEqualTo(ProfileEntity.Status.PUBLISHED);
        assertThat(entity.getRevision()).isEqualTo(7);
        assertThat(entity.getDescription()).isEqualTo(" texto Ω\n ");
        assertThat(mapper.toDomain(entity, json)).isEqualTo(original);
    }

    @Test
    void replacementUpdatesTheSameEntityAndNeverReplacesItsIdentity() {
        var managed = mapper.toEntity(profile("id", "Antes", Profile.Status.DRAFT, 0), json);
        Profile replacement = profile("different-id", "Después", Profile.Status.PUBLISHED, 1)
            .toBuilder().version("2").description(" descripción distinta ")
            .rules(List.of(new Profile.Rule("eventDate", Profile.Kind.date, Profile.Severity.ERROR,
                Profile.Condition.always, " fecha necesaria ", " otra fuente "))).build();
        mapper.replace(managed, replacement, json);

        assertThat(managed.getId()).isEqualTo("id");
        assertThat(mapper.toDomain(managed, json)).isEqualTo(replacement.toBuilder().id("id").build());
    }
}
