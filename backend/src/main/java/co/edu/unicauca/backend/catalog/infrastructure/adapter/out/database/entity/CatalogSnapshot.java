package co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "catalog_snapshot")
public class CatalogSnapshot {
    @Id private int id;
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

    public void setGeneration(long generation) { this.generation = generation; }
    public void setSnapshotVersion(long snapshotVersion) { this.snapshotVersion = snapshotVersion; }
    public void setPayload(String payload) { this.payload = payload; }
    public void setSourceHash(String sourceHash) { this.sourceHash = sourceHash; }
    public void setSourceRevision(String sourceRevision) { this.sourceRevision = sourceRevision; }
    public void setRawSources(String rawSources) { this.rawSources = rawSources; }
    public void setSeedProvenance(String seedProvenance) { this.seedProvenance = seedProvenance; }
    public void setActivatedAt(Instant activatedAt) { this.activatedAt = activatedAt; }
    public void setLastAttempt(Instant lastAttempt) { this.lastAttempt = lastAttempt; }
    public void setLastFailure(String lastFailure) { this.lastFailure = lastFailure; }
    public void setTermCount(int termCount) { this.termCount = termCount; }
    public void setAdded(int added) { this.added = added; }
    public void setModified(int modified) { this.modified = modified; }
    public void setDeprecated(int deprecated) { this.deprecated = deprecated; }
}
