package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.out.database.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "validation_configuration")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConfigurationEntity {
    @Id private Short id;
    @Setter @Column(nullable = false) private long revision;
    @Setter @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb")
    private String contexts;

    @Builder
    public ConfigurationEntity(Short id, long revision, String contexts) {
        this.id = id;
        this.revision = revision;
        this.contexts = contexts;
    }
}
