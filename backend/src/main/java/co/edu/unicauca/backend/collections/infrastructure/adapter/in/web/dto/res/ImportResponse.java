package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res;

import java.util.UUID;

public record ImportResponse(UUID idempotencyKey, UUID collectionId, long revision, int inserted) {}
