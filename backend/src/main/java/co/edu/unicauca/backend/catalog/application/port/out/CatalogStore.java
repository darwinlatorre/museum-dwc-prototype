package co.edu.unicauca.backend.catalog.application.port.out;

import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import java.io.IOException;

/** Cada mutación es atómica. activate comprueba generación y conservación bajo el mismo bloqueo. */
public interface CatalogStore {
    void initialize() throws IOException;
    String payload();
    CatalogStatus status();
    long beginAttempt();
    void activate(long generation, CatalogCandidate candidate);
    void fail(long generation);
}
