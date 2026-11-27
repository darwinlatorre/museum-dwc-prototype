package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Null quita el emoji; el dominio exige que pertenezca a la lista de animales. */
public record EmojiRequest(@Size(min = 1, max = 16) String emoji, @NotNull @PositiveOrZero Long expectedRevision) {}
