package co.edu.unicauca.backend.collections.application.port.out;

import java.util.List;
import java.util.Map;

/** The consuming feature owns this snapshot contract. Locks last for the whole write. */
public interface ValidationAuthority {
    Snapshot lockCurrent();

    record Snapshot(long configurationRevision, long catalogVersion,
            Map<String, List<String>> requiredFields, List<String> termNames) {
        public Snapshot {
            requiredFields = requiredFields.entrySet().stream().collect(java.util.stream.Collectors.toUnmodifiableMap(
                Map.Entry::getKey, entry -> List.copyOf(entry.getValue())));
            termNames = List.copyOf(termNames);
        }
    }
}
