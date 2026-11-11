package co.edu.unicauca.backend.collections.domain.model;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;

/** Immutable application values; biological text is never normalized here. */
public final class CollectionModel {
    private CollectionModel() {}

    @Builder public record Info(UUID id, String name, String context, long revision, long activeCount, long trashCount) {}
    @Builder public record Row(int sourceRow, List<String> originalValues, List<String> values) {
        public Row {
            originalValues = List.copyOf(originalValues);
            values = List.copyOf(values);
        }
    }
    @Builder public record Record(UUID id, UUID collectionId, List<String> headers, Map<String, String> mapping,
            int sourceRow, List<String> originalValues, List<String> values, UUID importKey,
            long configurationRevision, long catalogVersion, boolean trashed) {
        public Record {
            headers = List.copyOf(headers);
            mapping = Map.copyOf(mapping);
            originalValues = List.copyOf(originalValues);
            values = List.copyOf(values);
        }
    }
    public record Issue(String field, Integer row, String severity, String context,
            long configurationRevision, String description) {}
    public record Page<T>(List<T> items, int page, int size, long totalElements) {
        public Page { items = List.copyOf(items); }
    }
    public record Receipt(UUID idempotencyKey, String identity, UUID collectionId, long revision, int inserted) {}
    public enum Trash { ACTIVE, TRASHED, ALL }
}
