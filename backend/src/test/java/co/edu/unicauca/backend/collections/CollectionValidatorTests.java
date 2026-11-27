package co.edu.unicauca.backend.collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Row;
import co.edu.unicauca.backend.collections.domain.validation.CollectionValidator;

class CollectionValidatorTests {
    final CollectionValidator validator = new CollectionValidator();
    List<String> descriptions(String field, String value) {
        return validator.validate(List.of(field), Map.of(), List.of(new Row(2, List.of(value), List.of(value))),
            List.of(), List.of(field), "other", 7).stream().map(issue -> issue.description()).toList();
    }
    @Test void baselineDatesCoordinatesAndComponentsMatchBrowserWithoutNormalizing() {
        for (String value : List.of("2024", "2024-02", "2024-02-29", "2024/2025-01", "2024-01-01T23:59:59.123+14:00"))
            assertThat(descriptions("eventDate", value)).as(value).isEmpty();
        for (String value : List.of("0000", "2023-02-29", "2024-13", " 2024 ", "2024-01-01T24:00", "2024-01-01T12:00+14:01", "2024//2025"))
            assertThat(descriptions("eventDate", value)).as(value).containsExactly("Use una fecha válida con el formato YYYY-MM-DD.");
        for (String value : List.of("+90", "9e1", "-9.0E1", ".5", "90.000", " "))
            assertThat(descriptions("decimalLatitude", value)).as(value).isEmpty();
        for (String value : List.of("90.01", "NaN", "Infinity", " 1 ", "1,2", "1e309"))
            assertThat(descriptions("decimalLatitude", value)).as(value).containsExactly("Use un número decimal finito entre -90 y 90.");
        assertThat(descriptions("decimalLongitude", "180")).isEmpty();
        assertThat(descriptions("decimalLongitude", "-180.1")).containsExactly("Use un número decimal finito entre -180 y 180.");
        assertThat(descriptions("year", "0001")).isEmpty();
        assertThat(descriptions("month", "13")).containsExactly("Use un número entero para month entre 1 y 12.");
        assertThat(descriptions("day", "1.0")).containsExactly("Use un número entero para day entre 1 y 31.");
        var values = List.of("2024-02-29", "2023", "02", "29");
        var issues = validator.validate(List.of("eventDate", "year", "month", "day"), Map.of(),
            List.of(new Row(9, values, values)), List.of(), List.of("eventDate", "year", "month", "day"), "other", 7);
        assertThat(issues.stream().map(i -> i.description())).containsExactly(
            "El año, el mes y el día no forman una fecha válida.", "El componente de fecha no coincide con eventDate.");
    }
    @Test void requiredFieldsAndUnknownSuggestionsAreLiteralAndKeepProvenance() {
        var issues = validator.validate(List.of(" ID ", "science"), Map.of(" ID ", "occurrenceID"),
            List.of(new Row(4, List.of("  ", "a"), List.of("  ", "a"))),
            List.of("occurrenceID", "county"), List.of("occurrenceID", "scientificName"), "marine", 11);
        assertThat(issues).hasSize(3);
        assertThat(issues.get(0).description()).isEqualTo("Columna desconocida. No se encontró una equivalencia Darwin Core.");
        assertThat(issues.get(0).field()).isEqualTo("science");
        assertThat(issues.get(1).field()).isEqualTo("occurrenceID");
        assertThat(issues.get(1).row()).isEqualTo(4);
        assertThat(issues.get(1).description()).isEqualTo("occurrenceID es obligatorio en este contexto.");
        assertThat(issues.get(1).context()).isEqualTo("marine");
        assertThat(issues.get(1).configurationRevision()).isEqualTo(11);
        assertThat(issues.get(2).row()).isNull();
        assertThat(validator.validate(List.of("occurrenceID"), Map.of("occurrenceID", ""),
            List.of(new Row(1, List.of(" 0001 "), List.of(" 0001 "))), List.of("occurrenceID"),
            List.of("occurrenceID"), "other", 0)).isEmpty();
    }
    @Test void componentNumberConversionMatchesJavascriptEvenForRejectedIntegerForms() {
        for (String year : List.of("0x7e8", "0b11111101000", "0o3750", "\u00a02024\u00a0")) {
            var values = List.of(year, "2", "29");
            var issues = validator.validate(List.of("year", "month", "day"), Map.of(), List.of(new Row(1, values, values)),
                List.of(), List.of("year", "month", "day"), "other", 1);
            assertThat(issues.stream().map(issue -> issue.description())).as(year)
                .containsExactly("Use un número entero para year entre 1 y 9999.");
        }
        var values = List.of("2024d", "2", "29");
        assertThat(validator.validate(List.of("year", "month", "day"), Map.of(), List.of(new Row(1, values, values)),
            List.of(), List.of("year", "month", "day"), "other", 1).stream().map(issue -> issue.description()))
            .containsExactly("Use un número entero para year entre 1 y 9999.", "El año, el mes y el día no forman una fecha válida.");
    }

    @Test void rejectsAmbiguousMappingAndBoundedShapesBeforeBusinessValidation() {
        assertThatThrownBy(() -> validator.validate(List.of("a", "b"), Map.of("a", "x", "b", "x"),
            List.of(new Row(1, List.of("1", "2"), List.of("1", "2"))), List.of(), List.of(), "other", 0))
            .isInstanceOf(CollectionFailure.class).hasMessage("INVALID_MAPPING");
        assertThatThrownBy(() -> validator.validate(List.of("a"), Map.of(),
            List.of(new Row(1, List.of("1"), List.of())), List.of(), List.of(), "other", 0))
            .isInstanceOf(CollectionFailure.class).hasMessage("INVALID_REQUEST");
    }
}
