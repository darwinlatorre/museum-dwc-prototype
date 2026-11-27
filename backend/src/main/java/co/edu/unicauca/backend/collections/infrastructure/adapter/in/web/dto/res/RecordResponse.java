package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record RecordResponse(UUID id, UUID collectionId, List<String> headers, Map<String, String> mapping, int sourceRow,
        List<String> originalValues, List<String> values, UUID importKey, long configurationRevision,
        long catalogVersion, boolean trashed) {}
