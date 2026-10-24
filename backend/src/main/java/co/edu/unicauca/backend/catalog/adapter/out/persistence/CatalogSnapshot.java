package co.edu.unicauca.backend.catalog.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "catalog_snapshot")
public class CatalogSnapshot {
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

    public int getId() { return id; }
    public long getGeneration() { return generation; }
    public long getSnapshotVersion() { return snapshotVersion; }
    public String getPayload() { return payload; }
    public String getSourceHash() { return sourceHash; }
    public String getSourceRevision() { return sourceRevision; }
    public String getRawSources() { return rawSources; }
    public String getSeedProvenance() { return seedProvenance; }
    public Instant getActivatedAt() { return activatedAt; }
    public Instant getLastAttempt() { return lastAttempt; }
    public String getLastFailure() { return lastFailure; }
    public int getTermCount() { return termCount; }
    public int getAdded() { return added; }
    public int getModified() { return modified; }
    public int getDeprecated() { return deprecated; }
}
