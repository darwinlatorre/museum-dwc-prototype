package co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.mapper;

import co.edu.unicauca.backend.catalog.domain.identity.CatalogHash;
import co.edu.unicauca.backend.catalog.domain.model.CatalogCandidate;
import co.edu.unicauca.backend.catalog.domain.model.CatalogStatus;
import co.edu.unicauca.backend.catalog.domain.model.Term;
import co.edu.unicauca.backend.catalog.domain.policy.CatalogPolicy;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.database.entity.CatalogSnapshot;
import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/** Convierte representaciones; la generación, el bloqueo y la política pertenecen al adaptador. */
@Mapper(config = BackendMapperConfig.class)
public interface CatalogPersistenceMapper {
    default List<Term> terms(String payload, @Context ObjectMapper json) {
        return json.readValue(payload, new TypeReference<>() {});
    }

    @Mapping(target = "active", source = "snapshot")
    @Mapping(target = "attempts", source = "generation")
    CatalogStatus toDomain(CatalogSnapshot snapshot, @Context ObjectMapper json);

    @Mapping(target = "revision", source = "sourceRevision")
    @Mapping(target = "hash", source = "sourceHash")
    @Mapping(target = "sourceHashes", source = "rawSources", qualifiedByName = "sourceHashes")
    CatalogStatus.Active toActive(CatalogSnapshot snapshot, @Context ObjectMapper json);

    @Named("sourceHashes")
    default Map<String, String> sourceHashes(String rawSources, @Context ObjectMapper json) {
        var hashes = new TreeMap<String, String>();
        json.readTree(rawSources).properties().forEach(entry ->
            hashes.put(entry.getKey(), CatalogHash.hash(entry.getValue().asString())));
        return hashes;
    }

    @Named("contentHash")
    default String contentHash(String payload) { return CatalogHash.hash(payload); }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "generation", ignore = true)
    @Mapping(target = "lastAttempt", ignore = true)
    @Mapping(target = "lastFailure", ignore = true)
    @Mapping(target = "snapshotVersion", ignore = true)
    @Mapping(target = "added", ignore = true)
    @Mapping(target = "modified", ignore = true)
    @Mapping(target = "deprecated", ignore = true)
    @Mapping(target = "payload", source = "payload")
    @Mapping(target = "sourceHash", source = "payload", qualifiedByName = "contentHash")
    @Mapping(target = "sourceRevision", constant = "bundled")
    @Mapping(target = "rawSources", constant = "{}")
    @Mapping(target = "seedProvenance", source = "provenance")
    @Mapping(target = "termCount", source = "count")
    @Mapping(target = "activatedAt", source = "time")
    void initialize(@MappingTarget CatalogSnapshot snapshot, String payload, String provenance,
                    int count, Instant time, @Context ObjectMapper json);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "generation", ignore = true)
    @Mapping(target = "lastAttempt", ignore = true)
    @Mapping(target = "lastFailure", ignore = true)
    @Mapping(target = "seedProvenance", ignore = true)
    @Mapping(target = "payload", source = "candidate.payload")
    @Mapping(target = "sourceHash", source = "candidate.hash")
    @Mapping(target = "sourceRevision", source = "candidate.revision")
    @Mapping(target = "rawSources", source = "candidate.rawSources")
    @Mapping(target = "activatedAt", source = "time")
    @Mapping(target = "termCount", expression = "java(candidate.terms().size())")
    @Mapping(target = "added", source = "diff.added")
    @Mapping(target = "modified", source = "diff.modified")
    @Mapping(target = "deprecated", source = "diff.deprecated")
    @Mapping(target = "snapshotVersion", source = "version")
    void replace(@MappingTarget CatalogSnapshot snapshot, CatalogCandidate candidate, CatalogPolicy.Diff diff,
                 long version, Instant time, @Context ObjectMapper json);
}
