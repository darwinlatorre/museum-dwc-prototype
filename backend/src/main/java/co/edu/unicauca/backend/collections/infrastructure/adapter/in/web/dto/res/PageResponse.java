package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res;

import java.util.List;

public record PageResponse<T>(List<T> items, int page, int size, long totalElements) {}
