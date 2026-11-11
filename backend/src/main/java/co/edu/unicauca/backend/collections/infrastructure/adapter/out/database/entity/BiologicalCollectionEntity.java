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
@Table(name = "biological_collection")
@Getter
@Setter
@NoArgsConstructor
public class BiologicalCollectionEntity {
    @Id @Setter(AccessLevel.NONE) private UUID id;
    private String name;
    private String context;
    private long revision;

    public BiologicalCollectionEntity(UUID id) { this.id = id; }
}
