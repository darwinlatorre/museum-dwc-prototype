package co.edu.unicauca.backend.collections.application.port.in;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Row;

public final class CollectionCommands {
    private CollectionCommands() {}
    public record Import(UUID collectionId, String name, String context, Long expectedRevision,
            long configurationRevision, long catalogVersion, UUID idempotencyKey, boolean warningsConfirmed,
            List<String> headers, Map<String, String> mapping, List<Row> rows) {
        public Import {
            headers = List.copyOf(headers);
            mapping = Map.copyOf(mapping);
            rows = List.copyOf(rows);
        }
    }
    public record Add(long expectedRevision, long configurationRevision, long catalogVersion,
            boolean warningsConfirmed, List<String> headers, Map<String, String> mapping, Row row) {}
    public record Edit(long expectedRevision, long configurationRevision, long catalogVersion,
            boolean warningsConfirmed, List<String> values) {}
    public record Restore(long expectedRevision, long configurationRevision, long catalogVersion,
            boolean warningsConfirmed) {}
}
