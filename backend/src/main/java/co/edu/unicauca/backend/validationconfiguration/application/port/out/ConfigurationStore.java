package co.edu.unicauca.backend.validationconfiguration.application.port.out;

import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;

public interface ConfigurationStore {
    ValidationConfiguration get();
    ValidationConfiguration lock();
    void replace(ValidationConfiguration configuration);
    void insertSeed(ValidationConfiguration seed);
}
