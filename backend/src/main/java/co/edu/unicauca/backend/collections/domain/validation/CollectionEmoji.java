package co.edu.unicauca.backend.collections.domain.validation;

import java.util.List;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure.Code;

/** Identificador visual opcional: solo emojis de animales de esta lista (el frontend ofrece la misma). */
public final class CollectionEmoji {
    public static final List<String> ANIMALS = List.of(
        "🦋", "🐞", "🐝", "🐜", "🦗", "🕷️", "🦂", "🐌",
        "🦎", "🐍", "🐢", "🐸", "🐊",
        "🦜", "🦉", "🦅", "🐦", "🦩", "🐧",
        "🐟", "🐠", "🦈", "🐙", "🦀", "🐚", "🪼",
        "🦇", "🐒", "🦊", "🐿️", "🦥", "🐆");

    private CollectionEmoji() {}

    /** Null quita el emoji; cualquier otro valor debe pertenecer a la lista. */
    public static String require(String emoji) {
        if (emoji != null && !ANIMALS.contains(emoji)) throw new CollectionFailure(Code.INVALID_REQUEST);
        return emoji;
    }
}
