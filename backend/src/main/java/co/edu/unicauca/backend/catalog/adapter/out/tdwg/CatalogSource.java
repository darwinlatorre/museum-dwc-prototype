package co.edu.unicauca.backend.catalog.adapter.out.tdwg;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface CatalogSource {
    List<String> PATHS = List.of("terms/terms.csv", "dc-for-dwc/dc-for-dwc.csv", "dcterms-for-dwc/dcterms-for-dwc.csv");
    SourceSet fetch() throws IOException;

    record SourceSet(String revision, Map<String, String> documents) {
        public SourceSet { documents = Map.copyOf(documents); }
    }
}
