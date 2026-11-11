package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

@Entity(name = "CollectionCatalogView")
@Table(name = "catalog_snapshot")
@Immutable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectionCatalogView {
    @Id private int id;
    private long snapshotVersion;
    @Column(columnDefinition = "text") private String payload;
}
