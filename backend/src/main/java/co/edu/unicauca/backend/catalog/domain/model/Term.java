package co.edu.unicauca.backend.catalog.domain.model;

import lombok.Builder;

@Builder
public record Term(String name, String uri, String definition, String category, String status) {}
