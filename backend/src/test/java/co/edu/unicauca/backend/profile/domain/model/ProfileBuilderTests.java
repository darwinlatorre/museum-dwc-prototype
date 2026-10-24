package co.edu.unicauca.backend.profile.domain.model;

import java.util.List;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileBuilderTests {
    @Test
    void namedConstructionPreservesEveryValueWithoutNormalizingHistoricalData() {
        var rule = new Profile.Rule(" county ", Profile.Kind.requiredColumn, Profile.Severity.WARNING,
            Profile.Condition.sampling, " mensaje ", " fuente ");
        Profile profile = Profile.builder().id("id").name(" Museo ").version(" 1 ")
            .status(Profile.Status.PUBLISHED).revision(7).description(" texto Ω\n ")
            .rules(List.of(rule)).build();

        assertThat(profile).isEqualTo(new Profile("id", " Museo ", " 1 ", Profile.Status.PUBLISHED,
            7, " texto Ω\n ", List.of(rule)));
    }

    @Test
    void copyBuilderChangesLifecycleMetadataWithoutChangingSourceOrContent() {
        Profile source = Profile.builder().id("id").name("Museo").version("1")
            .status(Profile.Status.DRAFT).revision(4).description(" original ").rules(List.of()).build();
        Profile published = source.toBuilder().status(Profile.Status.PUBLISHED).revision(5).build();

        assertThat(published).isEqualTo(new Profile("id", "Museo", "1", Profile.Status.PUBLISHED,
            5, " original ", List.of()));
        assertThat(source.status()).isEqualTo(Profile.Status.DRAFT);
        assertThat(source.revision()).isEqualTo(4);
    }
}
