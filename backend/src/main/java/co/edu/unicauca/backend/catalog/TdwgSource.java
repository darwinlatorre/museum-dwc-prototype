package co.edu.unicauca.backend.catalog;

import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;

@Component
class TdwgSource implements CatalogSource {
    static final int MAX_BYTES = 4 * 1024 * 1024;
    private static final String COMMIT = "https://api.github.com/repos/tdwg/rs.tdwg.org/git/ref/heads/master";
    private static final String RAW = "https://raw.githubusercontent.com/tdwg/rs.tdwg.org/";
    private final ObjectMapper json;

    TdwgSource(ObjectMapper json) { this.json = json; }

    @Override public SourceSet fetch() throws IOException {
        String revision = json.readTree(download(URI.create(COMMIT), 128 * 1024)).path("object").path("sha").asString();
        if (!revision.matches("[0-9a-f]{40}")) throw new IOException("La revisión oficial TDWG no es válida.");
        var documents = new LinkedHashMap<String, String>();
        for (String path : PATHS) documents.put(path, download(URI.create(RAW + revision + "/" + path), MAX_BYTES));
        return new SourceSet(revision, documents);
    }

    private String download(URI uri, int limit) throws IOException {
        return read((HttpURLConnection) uri.toURL().openConnection(), limit);
    }

    static String read(HttpURLConnection connection, int limit) throws IOException {
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(10000);
        connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("User-Agent", "Museo-Unicauca-TDWG/1.0");
        long deadline = System.nanoTime() + Duration.ofSeconds(40).toNanos();
        try {
            if (connection.getResponseCode() != 200) throw new IOException("Respuesta HTTP TDWG no válida.");
            long expected = connection.getContentLengthLong();
            if (expected > limit) throw new IOException("La fuente TDWG supera el tamaño permitido.");
            try (var input = connection.getInputStream(); var output = new java.io.ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > limit || System.nanoTime() > deadline) {
                        throw new IOException("La descarga TDWG superó sus límites de tamaño o tiempo.");
                    }
                    output.write(buffer, 0, count);
                }
                if (expected >= 0 && expected != output.size()) throw new IOException("Descarga TDWG truncada.");
                return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(output.toByteArray())).toString();
            }
        } finally { connection.disconnect(); }
    }
}
