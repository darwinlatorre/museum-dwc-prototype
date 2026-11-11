package co.edu.unicauca.backend.collections.domain.validation;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public final class CollectionIdentity {
    private CollectionIdentity() {}
    public static String row(List<String> headers, Map<String, String> mapping, List<String> values) {
        var fields = new TreeMap<String, String>();
        for (int i = 0; i < headers.size(); i++) fields.put(CollectionValidator.effectiveField(headers.get(i), mapping), values.get(i));
        var identity = new StringBuilder();
        fields.forEach((field, value) -> { append(identity, field); append(identity, value); });
        return hash(identity.toString());
    }
    public static void append(StringBuilder target, Object value) {
        if (value == null) target.append("-1:");
        else { String text = value.toString(); target.append(text.length()).append(':').append(text); }
    }
    public static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }
    public static String occurrenceId(List<String> headers, Map<String, String> mapping, List<String> values) {
        for (int i = 0; i < headers.size(); i++) {
            if (CollectionValidator.effectiveField(headers.get(i), mapping).equals("occurrenceID")) {
                String id = values.get(i);
                return CollectionValidator.blank(id) ? null : id;
            }
        }
        return null;
    }
}
