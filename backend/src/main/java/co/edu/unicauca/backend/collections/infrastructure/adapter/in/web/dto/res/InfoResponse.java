package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res;

import java.util.UUID;

public record InfoResponse(UUID id, String name, String context, long revision, long activeCount, long trashCount, String emoji) {}
