package co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity;

import java.util.List;
import java.util.Map;
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

/** JSONB columns are mapped by Hibernate's JSON format mapper; no hand-written codec. */
@Entity
@Table(name = "collection_record")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectionRecordEntity extends AssignedIdEntity {
    @Id @Setter(AccessLevel.NONE) private UUID id;
    private UUID collectionId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private List<String> headers;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private Map<String, String> mapping;
    private int sourceRow;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private List<String> originalValues;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "row_values", columnDefinition = "jsonb") private List<String> values;
    private UUID importKey;
    private long configurationRevision;
    private long catalogVersion;
    private boolean trashed;
    private String rowHash;
    private String occurrenceHash;

    public CollectionRecordEntity(UUID id) { this.id = id; }
}
