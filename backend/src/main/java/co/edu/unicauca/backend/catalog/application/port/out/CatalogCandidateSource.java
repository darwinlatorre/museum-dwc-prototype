package co.edu.unicauca.backend.catalog.application.port.out;

import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;
import java.io.IOException;

public interface CatalogCandidateSource {
    CatalogCandidate fetch() throws IOException;
}
