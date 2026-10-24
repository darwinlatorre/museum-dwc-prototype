package co.edu.unicauca.backend.profile.adapter.out.persistence;

import co.edu.unicauca.backend.profile.domain.Profile;
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
    @Id
    @Column(length = 100)
    private String id;
    @Column(nullable = false, length = 200)
    private String name;
    @Column(nullable = false, length = 100)
    private String version;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Profile.Status status;
    // Client revision is not an ORM @Version: pessimistic locking serializes lifecycle changes.
    @Column(nullable = false)
    private long revision;
    @Column(nullable = false, columnDefinition = "text")
    private String description;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String rules;

    protected ProfileEntity() {}

    ProfileEntity(Profile profile, String rules) {
        id = profile.id();
        replace(profile, rules);
    }

    void replace(Profile profile, String rules) {
        name = profile.name();
        version = profile.version();
        status = profile.status();
        revision = profile.revision();
        description = profile.description();
        this.rules = rules;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getVersion() { return version; }
    public Profile.Status getStatus() { return status; }
    public long getRevision() { return revision; }
    public String getDescription() { return description; }
    public String getRules() { return rules; }
}
