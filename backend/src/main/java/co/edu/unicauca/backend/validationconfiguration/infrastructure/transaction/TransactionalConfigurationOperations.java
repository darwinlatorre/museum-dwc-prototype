package co.edu.unicauca.backend.validationconfiguration.infrastructure.transaction;

import co.edu.unicauca.backend.validationconfiguration.application.port.in.ConfigurationOperations;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

/** Mantiene el bloqueo hasta validar, guardar y vaciar; bootstrap también es atómico. */
@RequiredArgsConstructor
public class TransactionalConfigurationOperations implements ConfigurationOperations {
    private final ConfigurationOperations delegate;
    @Override @Transactional(readOnly = true)
    public ValidationConfiguration get() { return delegate.get(); }
    @Override @Transactional
    public ValidationConfiguration update(ValidationConfiguration configuration) { return delegate.update(configuration); }
    @Override @Transactional
    public void initialize(ValidationConfiguration seed) { delegate.initialize(seed); }
}
