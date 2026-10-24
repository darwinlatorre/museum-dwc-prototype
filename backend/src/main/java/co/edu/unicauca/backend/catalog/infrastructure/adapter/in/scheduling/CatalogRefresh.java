package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.scheduling;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.domain.policy.CatalogPolicy;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;

/** Ambos disparadores comparten el mismo caso de uso; aquí sólo quedan temporización y diagnóstico. */
public class CatalogRefresh implements Runnable, CatalogOperations {
    private static final Logger LOG = LoggerFactory.getLogger(CatalogRefresh.class);
    private final CatalogOperations operations;

    public CatalogRefresh(CatalogOperations operations) { this.operations = operations; }

    @Override
    @Scheduled(fixedDelayString = "${catalog.sync.delay:86400000}", initialDelayString = "${catalog.sync.initial-delay:60000}")
    public void run() { attempt(); }

    @Override public String payload() { return operations.payload(); }
    @Override public CatalogStatus status() { return operations.status(); }

    @Override public Attempt attempt() {
        Attempt attempt = operations.attempt();
        log(attempt);
        return attempt;
    }

    @Override public Result synchronize() {
        Result result = operations.synchronize();
        log(result.attempt());
        return result;
    }

    private void log(Attempt attempt) {
        if (!attempt.success()) {
            LOG.warn(CatalogPolicy.SYNC_FAILURE);
            if (attempt.generation() != null && !attempt.failureRecorded()) {
                LOG.warn("No se pudo registrar el fallo de sincronización TDWG.");
            }
        }
    }
}
