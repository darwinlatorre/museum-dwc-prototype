package co.edu.unicauca.backend.collections.domain.validation;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Issue;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Row;

/** Literal parity with importer/engine/validator.ts; intentionally does not normalize. */
public final class CollectionValidator {
    private static final Pattern COORDINATE = Pattern.compile("^[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?$");
    private static final Pattern ISO = Pattern.compile("^([0-9]{4})(?:-([0-9]{2})(?:-([0-9]{2})(?:T([0-9]{2}):([0-9]{2})(?::([0-9]{2})(?:\\.([0-9]+))?)?(?:Z|([+-])([0-9]{2}):([0-9]{2}))?)?)?)?$");
    private static final Pattern SPACE = Pattern.compile("^[\\x09-\\x0D\\x20\\xA0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]*$");
    public static boolean blank(String value) { return SPACE.matcher(value).matches(); }
    public static String effectiveField(String header, Map<String, String> mapping) {
        String target = mapping.get(header);
        return target == null || target.isEmpty() ? header : target;
    }
    public List<Issue> validate(List<String> headers, Map<String, String> mapping, List<Row> rows,
            List<String> required, List<String> terms, String context, long revision) {
        shape(headers, mapping, rows);
        var fields = headers.stream().map(header -> effectiveField(header, mapping)).toList();
        if (new HashSet<>(fields).size() != fields.size()) throw new CollectionFailure("INVALID_MAPPING");
        var issues = new ArrayList<Issue>();
        for (int i = 0; i < fields.size(); i++) {
            if (!terms.contains(fields.get(i))) {
                String needle = key(headers.get(i));
                var proposed = terms.stream().filter(term -> key(term).equals(needle)
                    || (needle.length() > 3 && (key(term).contains(needle) || needle.contains(key(term)))))
                    .limit(3).toList();
                add(issues, new Issue(headers.get(i), null, "WARNING", "system", revision,
                    "Columna desconocida." + (proposed.isEmpty() ? " No se encontró una equivalencia Darwin Core."
                    : " Posible equivalencia: " + String.join(", ", proposed) + ".")));
            }
        }
        for (String field : required) {
            int index = fields.indexOf(field);
            if (index < 0) add(issues, new Issue(field, null, "ERROR", context, revision, field + " es obligatorio en este contexto."));
            else for (Row row : rows) if (blank(row.values().get(index)))
                add(issues, new Issue(field, row.sourceRow(), "ERROR", context, revision, field + " es obligatorio en este contexto."));
        }
        for (Row row : rows) baseline(fields, row, issues, revision);
        return List.copyOf(issues);
    }
    public void shape(List<String> headers, Map<String, String> mapping, List<Row> rows) {
        if (headers == null || mapping == null || rows == null || headers.isEmpty() || headers.size() > 500
                || rows.isEmpty() || rows.size() > 50000 || new HashSet<>(headers).size() != headers.size())
            throw new CollectionFailure("INVALID_REQUEST");
        if (headers.stream().anyMatch(s -> !text(s, 2000)) || mapping.size() > 500
                || mapping.entrySet().stream().anyMatch(e -> !headers.contains(e.getKey()) || !text(e.getValue(), 2000)))
            throw new CollectionFailure("INVALID_REQUEST");
        long characters = headers.stream().mapToLong(String::length).sum();
        var sourceRows = new HashSet<Integer>();
        for (Row row : rows) {
            if (row == null || row.sourceRow() < 1 || !sourceRows.add(row.sourceRow())
                    || row.values().size() != headers.size() || row.originalValues().size() != headers.size())
                throw new CollectionFailure("INVALID_REQUEST");
            for (var values : List.of(row.values(), row.originalValues())) for (String value : values) {
                if (!text(value, 100000)) throw new CollectionFailure("INVALID_REQUEST");
                characters += value.length();
            }
        }
        if (characters > 20 * 1024 * 1024) throw new CollectionFailure("PAYLOAD_TOO_LARGE");
    }
    public static boolean text(String value, int limit) {
        if (value == null || value.length() > limit || value.indexOf('\0') >= 0) return false;
        // PostgreSQL UTF-8 cannot represent unpaired UTF-16 surrogates.
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (Character.isHighSurrogate(c)) {
                if (++i >= value.length() || !Character.isLowSurrogate(value.charAt(i))) return false;
            } else if (Character.isLowSurrogate(c)) return false;
        }
        return true;
    }
    private static String key(String value) { return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", ""); }
    private static void add(List<Issue> issues, Issue issue) {
        if (issues.size() >= 100000) throw new CollectionFailure("TOO_MANY_ISSUES");
        issues.add(issue);
    }
    private static void error(List<Issue> issues, String field, Row row, long revision, String message) {
        add(issues, new Issue(field, row.sourceRow(), "ERROR", "system", revision, message));
    }
    private static String get(List<String> fields, Row row, String field) {
        int index = fields.indexOf(field);
        return index < 0 ? "" : row.values().get(index);
    }
    private static void baseline(List<String> fields, Row row, List<Issue> issues, long revision) {
        for (String field : List.of("eventDate", "decimalLatitude", "decimalLongitude")) {
            String value = get(fields, row, field);
            if (blank(value)) continue;
            int limit = field.equals("decimalLatitude") ? 90 : 180;
            boolean valid = field.equals("eventDate") ? validIsoDate(value) : coordinate(value, limit);
            if (!valid) error(issues, field, row, revision, field.equals("eventDate")
                ? "Use una fecha válida con el formato YYYY-MM-DD."
                : "Use un número decimal finito entre " + (limit == 90 ? "-90 y 90" : "-180 y 180") + ".");
        }
        String y = get(fields, row, "year"), m = get(fields, row, "month"), d = get(fields, row, "day");
        var components = List.of(y, m, d);
        var names = List.of("year", "month", "day");
        var maxima = List.of(9999, 12, 31);
        for (int i = 0; i < 3; i++) {
            String value = components.get(i);
            if (!blank(value) && (!value.matches("[0-9]+") || number(value) < 1 || number(value) > maxima.get(i)))
                error(issues, names.get(i), row, revision, "Use un número entero para " + names.get(i) + " entre 1 y " + maxima.get(i) + ".");
        }
        if (!y.isEmpty() && !m.isEmpty() && !d.isEmpty() && !calendar(number(y), number(m), number(d)))
            error(issues, "day", row, revision, "El año, el mes y el día no forman una fecha válida.");
        else if (!m.isEmpty() && !d.isEmpty() && !calendar(y.isEmpty() ? 2000 : number(y), number(m), number(d)))
            error(issues, "day", row, revision, "El día no es válido para el mes seleccionado.");
        var parts = isoComponents(get(fields, row, "eventDate"));
        if (parts != null) for (int i = 0; i < parts.size(); i++) {
            String value = components.get(i);
            if (!blank(value) && number(value) != parts.get(i))
                error(issues, names.get(i), row, revision, "El componente de fecha no coincide con eventDate.");
        }
    }
    private static double number(String value) {
        // Number(string) in the browser also accepts unsigned radix prefixes and ECMAScript whitespace.
        String space = "[\\x09-\\x0D\\x20\\xA0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000\\uFEFF]";
        String literal = value.replaceAll("^" + space + "+|" + space + "+$", "");
        if (literal.isEmpty()) return 0;
        try {
            if (literal.matches("0[xX][0-9a-fA-F]+")) return new BigInteger(literal.substring(2), 16).doubleValue();
            if (literal.matches("0[bB][01]+")) return new BigInteger(literal.substring(2), 2).doubleValue();
            if (literal.matches("0[oO][0-7]+")) return new BigInteger(literal.substring(2), 8).doubleValue();
            if (literal.equals("Infinity") || literal.equals("+Infinity")) return Double.POSITIVE_INFINITY;
            if (literal.equals("-Infinity")) return Double.NEGATIVE_INFINITY;
            return COORDINATE.matcher(literal).matches() ? Double.parseDouble(literal) : Double.NaN;
        } catch (NumberFormatException ex) { return Double.NaN; }
    }
    private static boolean coordinate(String value, int limit) {
        if (!COORDINATE.matcher(value).matches()) return false;
        double number = number(value);
        return Double.isFinite(number) && Math.abs(number) <= limit;
    }
    private static boolean calendar(double y, double m, double d) {
        if (!Double.isFinite(y) || !Double.isFinite(m) || !Double.isFinite(d)
                || y != Math.floor(y) || m != Math.floor(m) || d != Math.floor(d)
                || y < 1 || y > 9999 || m < 1 || m > 12 || d < 1) return false;
        boolean leap = y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
        return d <= new int[]{31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}[(int) m - 1];
    }
    public static List<Integer> isoComponents(String value) {
        var match = ISO.matcher(value);
        if (!match.matches()) return null;
        int y = Integer.parseInt(match.group(1));
        int m = match.group(2) == null ? 1 : Integer.parseInt(match.group(2));
        int d = match.group(3) == null ? 1 : Integer.parseInt(match.group(3));
        if (!calendar(y, m, d)) return null;
        if (match.group(4) != null && (Integer.parseInt(match.group(4)) > 23 || Integer.parseInt(match.group(5)) > 59
                || (match.group(6) != null && Integer.parseInt(match.group(6)) > 59))) return null;
        if (match.group(9) != null) {
            int hour = Integer.parseInt(match.group(9)), minute = Integer.parseInt(match.group(10));
            if (hour > 14 || minute > 59 || (hour == 14 && minute != 0)) return null;
        }
        return match.group(2) == null ? List.of(y) : match.group(3) == null ? List.of(y, m) : List.of(y, m, d);
    }
    public static boolean validIsoDate(String value) {
        String[] parts = value.split("/", -1);
        if (parts.length > 2) return false;
        for (String part : parts) if (isoComponents(part) == null) return false;
        return true;
    }
}
