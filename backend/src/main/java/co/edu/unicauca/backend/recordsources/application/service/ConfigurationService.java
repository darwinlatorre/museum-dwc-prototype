package co.edu.unicauca.backend.recordsources.application.service;

import co.edu.unicauca.backend.recordsources.application.port.in.ConfigurationOperations;
import co.edu.unicauca.backend.recordsources.application.port.in.ConfigurationUpdate;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration.ContextFields;
import co.edu.unicauca.backend.recordsources.application.port.out.ConfigurationStore;
import co.edu.unicauca.backend.recordsources.domain.exception.ConfigurationConflictException;
import co.edu.unicauca.backend.recordsources.domain.exception.ConfigurationValidationException;
import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.recordsources.domain.validation.ConfigurationValidation;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ConfigurationService implements ConfigurationOperations {
    private final ConfigurationStore store;

    @Override public ValidationConfiguration get() { return store.get(); }

    @Override public ValidationConfiguration update(ConfigurationUpdate command) {
        ValidationConfiguration current = store.lock();
        if (command == null || command.configuration() == null) throw new ConfigurationValidationException();
        ValidationConfiguration request = command.configuration();
        if (request.revision() < 0) throw new ConfigurationValidationException();
        if (current.revision() != request.revision()) throw new ConfigurationConflictException();
        if (current.revision() == Long.MAX_VALUE) throw new ConfigurationConflictException();
        var requested = ConfigurationValidation.copy(request.contexts());
        var merged = requested.stream().map(entry -> {
            if (!command.preserveOptionalContexts().contains(entry.context())) return entry;
            var previous = current.contexts().stream().filter(old -> old.context() == entry.context())
                .findFirst().orElseThrow();
            // Explicit required values promote exact matches; untouched optional order/text survives.
            var optional = previous.optionalFields().stream()
                .filter(field -> !entry.requiredFields().contains(field)).toList();
            return new ContextFields(entry.context(), entry.requiredFields(), optional);
        }).toList();
        var next = new ValidationConfiguration(current.revision() + 1, ConfigurationValidation.copy(merged));
        store.replace(next);
        return next;
    }

    @Override public void initialize(ValidationConfiguration seed) {
        var valid = ConfigurationValidation.copy(seed);
        if (valid.revision() != 0) throw new ConfigurationValidationException();
        store.insertSeed(valid);
    }
}
