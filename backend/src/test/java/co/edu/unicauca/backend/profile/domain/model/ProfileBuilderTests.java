package co.edu.unicauca.backend.profile.domain.model;

import co.edu.unicauca.backend.profile.domain.model.Profile.ProfileBuilder;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileBuilderTests {
    @Test
    void generatedBuilderKeepsConstructorDefaultsAndDoesNotCopyOrValidateRules() {
        ProfileBuilder builder = Profile.builder();
        assertThat(builder.build()).isEqualTo(new Profile(null, null, null, null, 0, null, null));
        var rules = new ArrayList<Profile.Rule>();
        rules.add(null);
        Profile source = builder.id(" id ").name(" nombre ").revision(-1).rules(rules).build();
        assertThat(source).isEqualTo(new Profile(" id ", " nombre ", null, null, -1, null, rules));
        assertThat(source.rules()).isSameAs(rules);
        assertThat(source.toBuilder().build().rules()).isSameAs(rules);
        assertThat(source.toBuilder().build()).isEqualTo(source);
    }

    @Test
    void nestedBuildersKeepCanonicalConstructorSemantics() {
        var rule = Profile.Rule.builder().field(" campo ").message(" mensaje Ω\n ").build();
        assertThat(rule).isEqualTo(new Profile.Rule(" campo ", null, null, null, " mensaje Ω\n ", null));
        var content = Profile.Content.builder().name(" nombre ").rules(List.of(rule)).build();
        assertThat(content).isEqualTo(new Profile.Content(" nombre ", null, null, List.of(rule)));
    }

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
