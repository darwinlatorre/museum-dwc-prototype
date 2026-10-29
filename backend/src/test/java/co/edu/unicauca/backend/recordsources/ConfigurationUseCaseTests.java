package co.edu.unicauca.backend.recordsources;

import co.edu.unicauca.backend.recordsources.application.port.out.ConfigurationStore;
import co.edu.unicauca.backend.recordsources.application.service.ConfigurationService;
import co.edu.unicauca.backend.recordsources.domain.exception.ConfigurationConflictException;
import co.edu.unicauca.backend.recordsources.domain.exception.ConfigurationValidationException;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.Context;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.ContextFields;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ConfigurationUseCaseTests {
    final FakeStore store = new FakeStore();
    final ConfigurationService service = new ConfigurationService(store);
    ValidationConfiguration value(long revision, List<String> fields) {
        return new ValidationConfiguration(revision, Arrays.stream(Context.values())
            .map(context -> new ContextFields(context, fields)).toList());
    }
    @Test void updateLocksBeforeRevisionValidationAndCopiesWithoutTrimming() {
        var fields = new ArrayList<>(List.of(" campo ", "campo"));
        var result = service.update(value(0, fields));
        fields.clear();
        assertThat(result.revision()).isEqualTo(1);
        assertThat(result.contexts().getFirst().requiredFields()).containsExactly(" campo ", "campo");
        assertThatThrownBy(() -> result.contexts().getFirst().requiredFields().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThat(store.events).containsExactly("lock", "replace");
        assertThatThrownBy(() -> service.update(new ValidationConfiguration(0, null)))
            .isInstanceOf(ConfigurationConflictException.class);
        assertThat(store.value).isEqualTo(result);
        assertThat(store.writes).isEqualTo(1);
    }
    @Test void invalidFieldsAndSeedMetadataNeverWrite() {
        var original = store.value;
        for (List<String> fields : List.of(List.of(" "), List.of("\u2003"), List.of("x", "x"),
                List.of("x".repeat(201)), Arrays.asList((String) null))) {
            assertThatThrownBy(() -> service.update(value(0, fields))).isInstanceOf(ConfigurationValidationException.class);
            assertThatThrownBy(() -> service.initialize(value(0, fields))).isInstanceOf(ConfigurationValidationException.class);
        }
        assertThatThrownBy(() -> service.initialize(value(1, List.of()))).isInstanceOf(ConfigurationValidationException.class);
        assertThat(store.value).isEqualTo(original);
        assertThat(store.writes).isZero();
    }
    @Test void bootstrapIsIdempotentAndEmptyListsAreExplicitConfiguration() {
        service.initialize(value(0, List.of("seed")));
        var saved = service.update(value(0, List.of()));
        service.initialize(value(0, List.of("different seed")));
        assertThat(service.get()).isEqualTo(saved);
        assertThat(saved.contexts()).allSatisfy(entry -> assertThat(entry.requiredFields()).isEmpty());
        assertThat(store.writes).isEqualTo(1);
    }
    static class FakeStore implements ConfigurationStore {
        ValidationConfiguration value = new ValidationConfiguration(0, Arrays.stream(Context.values())
            .map(context -> new ContextFields(context, List.of("original"))).toList());
        final List<String> events = new ArrayList<>();
        int writes;
        @Override public ValidationConfiguration get() { return value; }
        @Override public ValidationConfiguration lock() { events.add("lock"); return value; }
        @Override public void replace(ValidationConfiguration next) { events.add("replace"); writes++; value = next; }
        @Override public void insertSeed(ValidationConfiguration seed) { if (value == null) { value = seed; writes++; } }
    }
}
