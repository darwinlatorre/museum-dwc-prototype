package co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "catalog_snapshot")
public class CatalogSnapshot {
    @Id @Setter(AccessLevel.NONE) private int id;
    private long generation;
    private long snapshotVersion;
    @Column(columnDefinition = "text") private String payload;
    @Column(length = 64) private String sourceHash;
    @Column(length = 100) private String sourceRevision;
    @Column(columnDefinition = "text") private String rawSources;
    @Column(columnDefinition = "text") private String seedProvenance;
    private Instant activatedAt;
    private Instant lastAttempt;
    @Column(columnDefinition = "text") private String lastFailure;
    private int termCount;
    private int added;
    private int modified;
    private int deprecated;

}
