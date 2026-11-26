package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity;

import java.util.UUID;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Transient;
import org.springframework.data.domain.Persistable;

/**
 * UUIDs are assigned by the application, so Spring Data cannot infer newness from a null id and would
 * {@code merge} (SELECT then INSERT). Tracking the lifecycle lets {@code save} persist new rows directly.
 */
@MappedSuperclass
public abstract class AssignedIdEntity implements Persistable<UUID> {
    @Transient private boolean persisted;

    @Override public boolean isNew() { return !persisted; }

    @PostLoad
    @PostPersist
    void markPersisted() { persisted = true; }
}
