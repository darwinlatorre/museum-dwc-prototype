package co.edu.unicauca.backend.profile;

import co.edu.unicauca.backend.profile.application.port.out.ProfileStore;
import co.edu.unicauca.backend.profile.application.service.ProfileService;
import co.edu.unicauca.backend.profile.domain.model.Profile;
import co.edu.unicauca.backend.profile.domain.exception.ProfileNotFoundException;
import co.edu.unicauca.backend.profile.domain.exception.ProfileValidationException;
import co.edu.unicauca.backend.profile.domain.exception.ProfileConflictException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import static org.assertj.core.api.Assertions.*;

class ProfileUseCaseTests {
    private final FakeStore store = new FakeStore();
    private final ProfileService service = new ProfileService(store);

    private static Profile.Rule rule() {
        return new Profile.Rule(" county ", Profile.Kind.requiredColumn, Profile.Severity.WARNING,
            Profile.Condition.sampling, "  Mensaje original  ", "  Fuente original  ");
    }

    private static Profile.Content content() {
        return new Profile.Content("  Museo  ", "  1  ", "  Texto original  ", List.of(rule()));
    }

    @Test
    void lifecyclePreservesTextCopiesRulesAndIncrementsExplicitRevision() {
        var rules = new ArrayList<>(List.of(rule()));
        Profile draft = service.create(new Profile.Content("  Museo  ", "  1  ", "  Texto original  ", rules));
        UUID.fromString(draft.id());
        assertThat(draft.name()).isEqualTo("Museo");
        assertThat(draft.version()).isEqualTo("1");
        assertThat(draft.description()).isEqualTo("  Texto original  ");
        assertThat(draft.rules()).containsExactly(rule());
        rules.clear();
        assertThat(draft.rules()).containsExactly(rule());
        assertThatThrownBy(() -> draft.rules().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThat(draft.status()).isEqualTo(Profile.Status.DRAFT);
        assertThat(draft.revision()).isZero();

        Profile edited = service.update(draft.id(), content(), 0);
        assertThat(edited.revision()).isEqualTo(1);
        Profile published = service.publish(draft.id());
        assertThat(published).isEqualTo(new Profile(draft.id(), "Museo", "1", Profile.Status.PUBLISHED,
            2, "  Texto original  ", List.of(rule())));
        assertThat(service.list()).containsExactly(published);
        assertThat(store.events).containsExactly("insert", "lock", "replace", "lock", "replace", "list");
    }

    @Test
    void publishedOperationsRejectWithoutWritesOrRevisionChanges() {
        Profile published = service.publish(service.create(content()).id());
        List<Profile> before = service.list();
        int writes = store.writes;
        String message = "Las versiones publicadas son inmutables; duplique el perfil en una nueva versión.";
        assertThatThrownBy(() -> service.update(published.id(), content(), 0))
            .isInstanceOf(ProfileConflictException.class).hasMessage(message);
        assertThatThrownBy(() -> service.publish(published.id()))
            .isInstanceOf(ProfileConflictException.class).hasMessage(message);
        assertThat(service.list()).isEqualTo(before);
        assertThat(store.writes).isEqualTo(writes);
    }

    @Test
    void staleRevisionRejectsBeforeValidationAndLeavesStoredContentUnchanged() {
        Profile draft = service.create(content());
        Profile edited = service.update(draft.id(), new Profile.Content("Cambio", "2", "editado", List.of()), 0);
        int writes = store.writes;
        assertThatThrownBy(() -> service.update(draft.id(), null, 0))
            .isInstanceOf(ProfileConflictException.class)
            .hasMessage("La revisión del perfil cambió; actualice los datos antes de guardar.");
        assertThat(service.list()).containsExactly(edited);
        assertThat(store.writes).isEqualTo(writes);
    }

    @Test
    void duplicatePublishedVersionStartsIndependentDraftWithoutChangingSource() {
        Profile source = service.publish(service.create(content()).id());
        Profile duplicate = service.duplicate(source.id(), " Copia ", " 2 ");
        assertThat(duplicate.id()).isNotEqualTo(source.id());
        assertThat(duplicate.name()).isEqualTo("Copia");
        assertThat(duplicate.version()).isEqualTo("2");
        assertThat(duplicate.status()).isEqualTo(Profile.Status.DRAFT);
        assertThat(duplicate.revision()).isZero();
        assertThat(duplicate.description()).isEqualTo(source.description());
        assertThat(duplicate.rules()).isEqualTo(source.rules());
        service.update(duplicate.id(), new Profile.Content("Copia", "2", "nueva", List.of()), 0);
        assertThat(store.rows.get(source.id())).isEqualTo(source);
        assertThat(store.rows.get(duplicate.id()).rules()).isEmpty();
    }

    @Test
    void missingProfilesKeepExactErrorAndDoNotWrite() {
        assertThatThrownBy(() -> service.publish("missing")).isInstanceOf(ProfileNotFoundException.class)
            .hasMessage("No se encontró el perfil.");
        assertThatThrownBy(() -> service.update("missing", content(), 0)).isInstanceOf(ProfileNotFoundException.class)
            .hasMessage("No se encontró el perfil.");
        assertThatThrownBy(() -> service.duplicate("missing", "Copia", "2")).isInstanceOf(ProfileNotFoundException.class)
            .hasMessage("No se encontró el perfil.");
        assertThat(service.list()).isEmpty();
        assertThat(store.writes).isZero();
    }

    static Stream<Profile.Content> invalidContents() {
        var cases = new ArrayList<Profile.Content>();
        cases.add(null);
        for (String name : Arrays.asList(null, "", " \t\n", "a".repeat(201))) {
            cases.add(new Profile.Content(name, "1", "", List.of()));
        }
        for (String version : Arrays.asList(null, "", "\u2003", "a".repeat(101))) {
            cases.add(new Profile.Content("Museo", version, "", List.of()));
        }
        cases.add(new Profile.Content("Museo", "1", null, List.of()));
        cases.add(new Profile.Content("Museo", "1", "a".repeat(10001), List.of()));
        cases.add(new Profile.Content("Museo", "1", "", null));
        cases.add(new Profile.Content("Museo", "1", "", Arrays.asList((Profile.Rule) null)));
        cases.add(new Profile.Content("Museo", "1", "", java.util.Collections.nCopies(2001, rule())));
        for (String field : Arrays.asList(null, "", " ", "a".repeat(201))) {
            cases.add(withRule(new Profile.Rule(field, rule().kind(), rule().severity(), rule().condition(), "m", "s")));
        }
        cases.add(withRule(new Profile.Rule("f", null, rule().severity(), rule().condition(), "m", "s")));
        cases.add(withRule(new Profile.Rule("f", rule().kind(), null, rule().condition(), "m", "s")));
        cases.add(withRule(new Profile.Rule("f", rule().kind(), rule().severity(), null, "m", "s")));
        for (String message : Arrays.asList(null, "", " ", "a".repeat(2001))) {
            cases.add(withRule(new Profile.Rule("f", rule().kind(), rule().severity(), rule().condition(), message, "s")));
        }
        for (String source : Arrays.asList(null, "", " ", "a".repeat(4001))) {
            cases.add(withRule(new Profile.Rule("f", rule().kind(), rule().severity(), rule().condition(), "m", source)));
        }
        return cases.stream();
    }

    private static Profile.Content withRule(Profile.Rule rule) {
        return new Profile.Content("Museo", "1", "", List.of(rule));
    }

    @ParameterizedTest
    @MethodSource("invalidContents")
    void coreRejectsInvalidCreateAndEditWithoutWrites(Profile.Content invalid) {
        Profile draft = service.create(content());
        int writes = store.writes;
        assertThatThrownBy(() -> service.create(invalid)).isInstanceOf(ProfileValidationException.class)
            .hasMessage("El contenido del perfil no es válido.");
        assertThatThrownBy(() -> service.update(draft.id(), invalid, 0)).isInstanceOf(ProfileValidationException.class)
            .hasMessage("El contenido del perfil no es válido.");
        assertThat(service.list()).containsExactly(draft);
        assertThat(store.writes).isEqualTo(writes);
    }

    @Test
    void maximumLengthsEmptyDescriptionAndEmptyRulesRemainValid() {
        Profile.Rule boundary = new Profile.Rule("f".repeat(200), Profile.Kind.date, Profile.Severity.ERROR,
            Profile.Condition.always, "m".repeat(2000), "s".repeat(4000));
        var input = new Profile.Content("n".repeat(200), "v".repeat(100), "d".repeat(10000),
            java.util.Collections.nCopies(2000, boundary));
        Profile result = service.create(input);
        assertThat(result.name()).isEqualTo(input.name());
        assertThat(result.version()).isEqualTo(input.version());
        assertThat(result.description()).isEqualTo(input.description());
        assertThat(result.rules()).isEqualTo(input.rules());
        Profile empty = service.create(new Profile.Content("Vacío", "1", "", List.of()));
        assertThat(empty.description()).isEmpty();
        assertThat(empty.rules()).isEmpty();
    }

    static Stream<Profile.Content> invalidSeedContents() {
        return invalidContents().filter(java.util.Objects::nonNull);
    }

    @ParameterizedTest
    @MethodSource("invalidSeedContents")
    void seedsUseTheSameContentValidationWithoutWrites(Profile.Content invalid) {
        Profile seed = new Profile(UUID.randomUUID().toString(), invalid.name(), invalid.version(),
            Profile.Status.PUBLISHED, 0, invalid.description(), invalid.rules());
        assertThatThrownBy(() -> service.initialize(List.of(seed))).isInstanceOf(ProfileValidationException.class)
            .hasMessage("El contenido del perfil no es válido.");
        assertThat(service.list()).isEmpty();
        assertThat(store.writes).isZero();
    }

    @Test
    void bootstrapIsIdempotentDoesNotReplacePublishedRowsAndValidatesSeedMetadata() {
        String id = UUID.randomUUID().toString();
        Profile seed = new Profile(id, "Museo", "1", Profile.Status.PUBLISHED, 0, "original", List.of(rule()));
        service.initialize(List.of(seed));
        service.initialize(List.of(new Profile(id, "Otro", "2", Profile.Status.PUBLISHED, 0, "cambiado", List.of())));
        assertThat(service.list()).containsExactly(seed);
        assertThat(store.writes).isEqualTo(1);
        for (Profile invalid : List.of(
                new Profile(id, "Museo", "1", Profile.Status.DRAFT, 0, "", List.of()),
                new Profile(id, "Museo", "1", Profile.Status.PUBLISHED, 1, "", List.of()))) {
            assertThatThrownBy(() -> service.initialize(List.of(invalid))).isInstanceOf(IllegalStateException.class)
                .hasMessage("Los perfiles iniciales deben estar publicados con revisión cero.");
        }
        assertThatThrownBy(() -> service.initialize(List.of(new Profile("invalid", "Museo", "1",
            Profile.Status.PUBLISHED, 0, "", List.of())))).isInstanceOf(IllegalArgumentException.class);
        assertThat(service.list()).containsExactly(seed);
        assertThat(store.writes).isEqualTo(1);
    }

    private static class FakeStore implements ProfileStore {
        final Map<String, Profile> rows = new LinkedHashMap<>();
        final List<String> events = new ArrayList<>();
        int writes;

        @Override public List<Profile> list() {
            events.add("list");
            return rows.values().stream().sorted(Comparator.comparing(Profile::name)
                .thenComparing(Profile::version).thenComparing(Profile::id)).toList();
        }
        @Override public Optional<Profile> find(String id) {
            events.add("find");
            return Optional.ofNullable(rows.get(id));
        }
        @Override public Optional<Profile> lock(String id) {
            events.add("lock");
            return Optional.ofNullable(rows.get(id));
        }
        @Override public void insert(Profile profile) {
            events.add("insert");
            rows.put(profile.id(), profile);
            writes++;
        }
        @Override public void replace(Profile profile) {
            events.add("replace");
            rows.put(profile.id(), profile);
            writes++;
        }
        @Override public void insertSeed(Profile profile) {
            events.add("seed");
            if (rows.putIfAbsent(profile.id(), profile) == null) writes++;
        }
    }
}
