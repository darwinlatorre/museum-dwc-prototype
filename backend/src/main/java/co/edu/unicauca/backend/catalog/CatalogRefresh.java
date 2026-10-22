package co.edu.unicauca.backend.catalog;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
class CatalogRefresh implements Runnable {
    private static final Logger LOG = LoggerFactory.getLogger(CatalogRefresh.class);
    private final CatalogSource source;
    private final CatalogParser parser;
    private final CatalogStore store;

    CatalogRefresh(CatalogSource source, CatalogParser parser, CatalogStore store) {
        this.source = source;
        this.parser = parser;
        this.store = store;
    }

    @Override
    @Scheduled(fixedDelayString = "${catalog.sync.delay:86400000}", initialDelayString = "${catalog.sync.initial-delay:60000}")
    public void run() {
        Long generation = null;
        try {
            generation = store.beginAttempt();
            // Network and parsing deliberately run outside the activation transaction.
            var candidate = parser.parse(source.fetch());
            store.activate(generation, candidate);
        } catch (IOException | RuntimeException exception) {
            LOG.warn("No se pudo actualizar el catálogo TDWG; se conserva la última versión válida.");
            if (generation != null) {
                try { store.fail(generation); }
                catch (RuntimeException persistenceFailure) { LOG.warn("No se pudo registrar el fallo de sincronización TDWG."); }
            }
        }
    }
}
