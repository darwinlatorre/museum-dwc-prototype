package co.edu.unicauca.backend.profile.infrastructure.adapter.out.database.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "profiles")
public class ProfileEntity {
    public enum Status { DRAFT, PUBLISHED }

    @Id
    @Column(length = 100)
    private String id;
    @Column(nullable = false, length = 200)
    private String name;
    @Column(nullable = false, length = 100)
    private String version;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;
    // Client revision is not an ORM @Version: pessimistic locking serializes lifecycle changes.
    @Column(nullable = false)
    private long revision;
    @Column(nullable = false, columnDefinition = "text")
    private String description;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String rules;

    protected ProfileEntity() {}

    public ProfileEntity(String id, String name, String version, Status status, long revision,
                         String description, String rules) {
        this.id = id;
        replace(name, version, status, revision, description, rules);
    }

    public void replace(String name, String version, Status status, long revision,
                        String description, String rules) {
        this.name = name;
        this.version = version;
        this.status = status;
        this.revision = revision;
        this.description = description;
        this.rules = rules;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getVersion() { return version; }
    public Status getStatus() { return status; }
    public long getRevision() { return revision; }
    public String getDescription() { return description; }
    public String getRules() { return rules; }
}
