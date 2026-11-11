package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity;

import java.util.UUID;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "collection_record")
@Getter
@Setter
@NoArgsConstructor
public class CollectionRecordEntity {
    @Id @Setter(AccessLevel.NONE) private UUID id;
    private UUID collectionId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private String headers;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private String mapping;
    private int sourceRow;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private String originalValues;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "row_values", columnDefinition = "jsonb") private String values;
    private UUID importKey;
    private long configurationRevision;
    private long catalogVersion;
    private boolean trashed;
    private String rowHash;
    private String occurrenceHash;

    public CollectionRecordEntity(UUID id) { this.id = id; }
}
