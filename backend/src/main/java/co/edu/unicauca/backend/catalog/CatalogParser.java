package co.edu.unicauca.backend.catalog;

import org.apache.commons.csv.CSVFormat;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.StringReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
class CatalogParser {
    private static final Set<String> HEADERS = Set.of("term_localName", "term_isDefinedBy", "rdfs_comment",
        "tdwgutility_organizedInClass", "term_deprecated");
    private final ObjectMapper json;

    CatalogParser(ObjectMapper json) { this.json = json; }

    Candidate parse(CatalogSource.SourceSet source) throws IOException {
        if (source == null || !source.revision().matches("[0-9a-f]{40}")
                || !source.documents().keySet().equals(Set.copyOf(CatalogSource.PATHS))) {
            throw new IOException("El conjunto de fuentes TDWG está incompleto o no tiene una revisión válida.");
        }
        List<CatalogController.Term> terms = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        Map<String, String> hashes = new LinkedHashMap<>();
        for (String path : CatalogSource.PATHS) {
            String document = source.documents().get(path);
            if (document.isEmpty() || document.length() > TdwgSource.MAX_BYTES) throw new IOException("Fuente TDWG vacía o demasiado grande.");
            hashes.put(path, hash(document));
            var format = CSVFormat.RFC4180.builder().setHeader().setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(false).setLenientEof(false).setTrailingData(false).get();
            int count = 0;
            try (var csv = format.parse(new StringReader(document))) {
                if (!csv.getHeaderMap().keySet().containsAll(HEADERS)
                        || csv.getHeaderNames().size() != csv.getHeaderMap().size()) throw new IOException("Esquema CSV TDWG incompatible.");
                for (var row : csv) {
                    if (!row.isConsistent()) throw new IOException("Fila CSV TDWG incompleta.");
                    String name = row.get("term_localName");
                    String uri = row.get("term_isDefinedBy") + name;
                    String definition = row.get("rdfs_comment");
                    String flag = row.get("term_deprecated");
                    if (name.isBlank() || definition.isBlank() || !URI.create(uri).isAbsolute()
                            || !Set.of("", "true", "false").contains(flag) || !seen.add(uri)) {
                        throw new IOException("Atributos TDWG inválidos o identificador duplicado.");
                    }
                    terms.add(new CatalogController.Term(name, uri, definition, row.get("tdwgutility_organizedInClass"),
                        flag.equals("true") ? "deprecated" : "current"));
                    count++;
                }
            } catch (IllegalArgumentException | java.io.UncheckedIOException exception) {
                throw new IOException("No se pudo interpretar el CSV TDWG completo.", exception);
            }
            if (count == 0) throw new IOException("Una fuente TDWG no contiene términos.");
        }
        String payload = json.writeValueAsString(terms);
        return new Candidate(source.revision(), List.copyOf(terms), payload, hash(json.writeValueAsString(hashes)),
            json.writeValueAsString(source.documents()), Map.copyOf(hashes));
    }

    static String hash(String value) {
        try {
            return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }

    record Candidate(String revision, List<CatalogController.Term> terms, String payload, String hash,
                     String rawSources, Map<String, String> hashes) {}
}
