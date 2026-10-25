package co.edu.unicauca.backend.catalog.application.service;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.application.port.out.CatalogCandidateSource;
import co.edu.unicauca.backend.catalog.application.port.out.CatalogStore;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import java.io.IOException;
import lombok.RequiredArgsConstructor;

/** No mantiene una transacción entre el inicio del intento y la activación. */
@RequiredArgsConstructor
public final class CatalogUseCase implements CatalogOperations {
    private final CatalogCandidateSource source;
    private final CatalogStore store;

    @Override public String payload() { return store.payload(); }
    @Override public CatalogStatus status() { return store.status(); }

    @Override
    public Attempt attempt() {
        Long generation = null;
        try {
            generation = store.beginAttempt();
            var candidate = source.fetch();
            store.activate(generation, candidate);
            return new Attempt(generation, true, false);
        } catch (IOException | RuntimeException exception) {
            boolean recorded = false;
            if (generation != null) {
                try {
                    store.fail(generation);
                    recorded = true;
                } catch (RuntimeException persistenceFailure) {
                    // El adaptador de entrada recibe el fallo de registro sin ocultar el resultado del intento.
                }
            }
            return new Attempt(generation, false, recorded);
        }
    }

    @Override
    public Result synchronize() {
        Attempt attempt = attempt();
        CatalogStatus status = store.status();
        Outcome outcome = attempt.generation() != null && status.attempts() != attempt.generation()
            ? Outcome.SUPERSEDED : attempt.success() ? Outcome.SUCCESS : Outcome.FAILED;
        return new Result(outcome, status, attempt);
    }
}
