package co.edu.unicauca.backend.recordsources.application.port.out;

import co.edu.unicauca.backend.recordsources.domain.model.ValidationConfiguration;

public interface ConfigurationStore {
    ValidationConfiguration get();
    ValidationConfiguration lock();
    void replace(ValidationConfiguration configuration);
    void insertSeed(ValidationConfiguration seed);
}
