package co.edu.unicauca.backend.catalog.infrastructure.adapter.out.tdwg;

import co.edu.unicauca.backend.catalog.application.port.out.CatalogCandidateSource;
import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;
import java.io.IOException;
import lombok.RequiredArgsConstructor;

/** La descarga y el análisis completo ocurren antes de abrir la transacción de activación. */
@RequiredArgsConstructor
public final class TdwgCatalogSource implements CatalogCandidateSource {
    private final CatalogSource source;
    private final CatalogParser parser;

    @Override public CatalogCandidate fetch() throws IOException { return parser.parse(source.fetch()); }
}
