package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity;

import java.util.UUID;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "collection_import")
@Getter
@Setter
@NoArgsConstructor
public class CollectionImportEntity {
    @Id @Setter(AccessLevel.NONE) private UUID idempotencyKey;
    private String identity;
    private UUID collectionId;
    private long revision;
    private int inserted;

    public CollectionImportEntity(UUID key) { this.idempotencyKey = key; }
}
