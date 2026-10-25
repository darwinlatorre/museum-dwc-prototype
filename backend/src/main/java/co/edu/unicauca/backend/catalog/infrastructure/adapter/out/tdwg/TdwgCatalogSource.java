package co.edu.unicauca.backend.catalog.infrastructure.adapter.out.tdwg;

import co.edu.unicauca.backend.catalog.application.port.out.CatalogCandidateSource;
import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;
import java.io.IOException;

/** La descarga y el análisis completo ocurren antes de abrir la transacción de activación. */
public final class TdwgCatalogSource implements CatalogCandidateSource {
    private final CatalogSource source;
    private final CatalogParser parser;

    public TdwgCatalogSource(CatalogSource source, CatalogParser parser) {
        this.source = source;
        this.parser = parser;
    }

    @Override public CatalogCandidate fetch() throws IOException { return parser.parse(source.fetch()); }
}
