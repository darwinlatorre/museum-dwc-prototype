package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

@RequiredArgsConstructor
public final class CollectionJson {
    private final ObjectMapper json;
    public String encode(Object value) { return json.writeValueAsString(value); }
    public List<String> strings(String value) {
        var result = new ArrayList<String>();
        for (var entry : json.readTree(value)) result.add(entry.asString());
        return List.copyOf(result);
    }
    public Map<String, String> mapping(String value) {
        var result = new LinkedHashMap<String, String>();
        json.readTree(value).properties().forEach(entry -> result.put(entry.getKey(), entry.getValue().asString()));
        return Map.copyOf(result);
    }
}
