package co.edu.unicauca.backend.collections.infrastructure.adapter.json;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

/** Strict transport types: never coerce JSON numbers/booleans to biological text. */
public final class CollectionRequestJson {
    private CollectionRequestJson() {}
    public static void properties(JsonNode node, String... names) {
        if (node == null || !node.isObject() || !node.propertyNames().equals(Set.of(names))) invalid();
    }
    public static String text(JsonNode node) {
        if (node == null || !node.isString() || node.stringValue().length() > 100000) return invalid();
        return node.stringValue();
    }
    public static String nullableText(JsonNode node) { return node.isNull() ? null : text(node); }
    public static UUID uuid(JsonNode node) {
        String value = text(node);
        UUID id = UUID.fromString(value);
        if (!id.toString().equalsIgnoreCase(value)) return invalid();
        return id;
    }
    public static UUID nullableUuid(JsonNode node) { return node.isNull() ? null : uuid(node); }
    public static long number(JsonNode node) {
        if (node == null || !node.isIntegralNumber() || !node.canConvertToLong() || node.longValue() < 0) return invalid();
        return node.longValue();
    }
    public static Long nullableNumber(JsonNode node) { return node.isNull() ? null : number(node); }
    public static int sourceRow(JsonNode node) {
        long number = number(node);
        if (number < 1 || number > Integer.MAX_VALUE) return invalid();
        return (int) number;
    }
    public static boolean bool(JsonNode node) {
        if (node == null || !node.isBoolean()) return invalid();
        return node.booleanValue();
    }
    public static List<String> texts(JsonNode node) {
        if (node == null || !node.isArray() || node.size() > 500) return invalid();
        var result = new ArrayList<String>();
        node.forEach(value -> result.add(text(value)));
        return List.copyOf(result);
    }
    public static Map<String, String> mapping(JsonNode node) {
        if (node == null || !node.isObject() || node.size() > 500) return invalid();
        var result = new LinkedHashMap<String, String>();
        node.properties().forEach(entry -> result.put(entry.getKey(), text(entry.getValue())));
        return Map.copyOf(result);
    }
    public static String context(JsonNode node) {
        String value = text(node);
        if (!Set.of("collection", "permit", "sampling", "marine", "other").contains(value)) return invalid();
        return value;
    }
    public static List<JsonNode> rows(JsonNode node) {
        if (node == null || !node.isArray() || node.isEmpty() || node.size() > 50000) return invalid();
        var rows = new ArrayList<JsonNode>();
        node.forEach(rows::add);
        return List.copyOf(rows);
    }
    private static <T> T invalid() { throw new IllegalArgumentException("Solicitud de colección inválida"); }
}
