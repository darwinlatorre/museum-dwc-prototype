package co.edu.unicauca.backend.recordsources.application.service;

import co.edu.unicauca.backend.recordsources.application.port.in.ConfigurationOperations;
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

    @Override public ValidationConfiguration update(ValidationConfiguration request) {
        ValidationConfiguration current = store.lock();
        if (request == null || request.revision() < 0) throw new ConfigurationValidationException();
        if (current.revision() != request.revision()) throw new ConfigurationConflictException();
        if (current.revision() == Long.MAX_VALUE) throw new ConfigurationConflictException();
        var next = new ValidationConfiguration(current.revision() + 1,
            ConfigurationValidation.copy(request.contexts()));
        store.replace(next);
        return next;
    }

    @Override public void initialize(ValidationConfiguration seed) {
        var valid = ConfigurationValidation.copy(seed);
        if (valid.revision() != 0) throw new ConfigurationValidationException();
        store.insertSeed(valid);
    }
}
