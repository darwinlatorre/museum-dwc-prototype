package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Consumer-owned, read-only projection. It cannot bootstrap or update the owner table. */
@Entity(name = "CollectionConfigurationView")
@Table(name = "validation_configuration")
@Immutable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectionConfigurationView {
    @Id private Short id;
    private long revision;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private String contexts;
}
