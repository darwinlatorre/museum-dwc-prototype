package co.edu.unicauca.backend.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "catalog_snapshot")
class CatalogSnapshot {
    @Id int id;
    long generation;
    long snapshotVersion;
    @Column(columnDefinition = "text") String payload;
    @Column(length = 64) String sourceHash;
    @Column(length = 100) String sourceRevision;
    @Column(columnDefinition = "text") String rawSources;
    @Column(columnDefinition = "text") String seedProvenance;
    Instant activatedAt;
    Instant lastAttempt;
    @Column(columnDefinition = "text") String lastFailure;
    int termCount;
    int added;
    int modified;
    int deprecated;

    protected CatalogSnapshot() {}
}
