package co.edu.unicauca.backend.collections.domain.model;

import co.edu.unicauca.backend.collections.domain.validation.CollectionValidator;

/** Read-only order: null field means numeric source row; field names remain literal. */
public record RecordOrder(String field, Direction direction) {
    public enum Direction { ASC, DESC }
    public RecordOrder {
        if (direction == null || (field != null && (field.isEmpty() || !CollectionValidator.text(field, 2000))))
            throw new CollectionFailure("INVALID_REQUEST");
    }
    public static RecordOrder parse(String field, String direction) {
        if (direction == null) return new RecordOrder(field, Direction.ASC);
        if (!direction.equals("ASC") && !direction.equals("DESC")) throw new CollectionFailure("INVALID_REQUEST");
        return new RecordOrder(field, Direction.valueOf(direction));
    }
}
