package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class CollectionResponses {
    private CollectionResponses() {}
    public record InfoResponse(UUID id, String name, String context, long revision, long activeCount, long trashCount) {}
    public record RecordResponse(UUID id, UUID collectionId, List<String> headers, Map<String, String> mapping, int sourceRow,
            List<String> originalValues, List<String> values, UUID importKey, long configurationRevision,
            long catalogVersion, boolean trashed) {}
    public record ImportResponse(UUID idempotencyKey, UUID collectionId, long revision, int inserted) {}
    public record IssueResponse(String field, Integer row, String severity, String context, long configurationRevision, String description) {}
    public record PageResponse<T>(List<T> items, int page, int size, long totalElements) {}
}
