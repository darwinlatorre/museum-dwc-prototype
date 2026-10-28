package co.edu.unicauca.backend.validationconfiguration.application.port.in;

import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;

public interface ConfigurationOperations {
    ValidationConfiguration get();
    ValidationConfiguration update(ValidationConfiguration configuration);
    void initialize(ValidationConfiguration seed);
}
