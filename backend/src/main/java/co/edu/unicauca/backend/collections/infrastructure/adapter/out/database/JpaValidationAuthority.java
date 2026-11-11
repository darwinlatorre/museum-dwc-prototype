package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;
import co.edu.unicauca.backend.collections.application.port.out.ValidationAuthority;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionConfigurationView;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionCatalogView;

/** Reads only published owner state, inside the caller's transaction; no productive feature dependency. */
@RequiredArgsConstructor
public final class JpaValidationAuthority implements ValidationAuthority {
    private final EntityManager entityManager;
    private final ObjectMapper json;

    @Override public Snapshot lockCurrent() {
        var configuration = entityManager.find(CollectionConfigurationView.class, (short) 1, LockModeType.PESSIMISTIC_WRITE);
        var catalog = entityManager.find(CollectionCatalogView.class, 1, LockModeType.PESSIMISTIC_READ);
        if (configuration == null || catalog == null || catalog.getPayload() == null) throw new CollectionFailure("AUTHORITY_UNAVAILABLE");
        var required = new LinkedHashMap<String, List<String>>();
        for (var context : json.readTree(configuration.getContexts())) {
            var fields = new ArrayList<String>();
            for (var field : context.get("requiredFields")) fields.add(field.asString());
            required.put(context.get("context").asString(), List.copyOf(fields));
        }
        var names = new ArrayList<String>();
        for (var term : json.readTree(catalog.getPayload())) names.add(term.get("name").asString());
        return new Snapshot(configuration.getRevision(), catalog.getSnapshotVersion(), required, names);
    }
}
