package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req;

import static co.edu.unicauca.backend.collections.infrastructure.adapter.json.CollectionRequestJson.*;
import co.edu.unicauca.backend.collections.infrastructure.adapter.json.CollectionRequestJson;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

public final class CollectionRequests {
    private CollectionRequests() {}
    public record RowRequest(@Positive int sourceRow,
            @NotNull @Size(max = 500) List<@NotNull String> originalValues,
            @NotNull @Size(max = 500) List<@NotNull String> values) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static RowRequest fromJson(JsonNode node) {
            properties(node, "sourceRow", "originalValues", "values");
            return new RowRequest(CollectionRequestJson.sourceRow(node.get("sourceRow")), texts(node.get("originalValues")), texts(node.get("values")));
        }
    }
    public record ImportRequest(UUID collectionId, @Size(max = 200) String name, @NotNull String context,
            @PositiveOrZero Long expectedRevision, @PositiveOrZero long configurationRevision,
            @PositiveOrZero long catalogVersion, @NotNull UUID idempotencyKey, boolean warningsConfirmed,
            @NotNull @Size(min = 1, max = 500) List<@NotNull String> headers,
            @NotNull @Size(max = 500) Map<String, String> mapping,
            @NotNull @Size(min = 1, max = 50000) List<@NotNull @Valid RowRequest> rows) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static ImportRequest fromJson(JsonNode node) {
            properties(node, "collectionId", "name", "context", "expectedRevision", "configurationRevision", "catalogVersion",
                "idempotencyKey", "warningsConfirmed", "headers", "mapping", "rows");
            return new ImportRequest(nullableUuid(node.get("collectionId")), nullableText(node.get("name")), CollectionRequestJson.context(node.get("context")),
                nullableNumber(node.get("expectedRevision")), number(node.get("configurationRevision")), number(node.get("catalogVersion")),
                uuid(node.get("idempotencyKey")), bool(node.get("warningsConfirmed")), texts(node.get("headers")), CollectionRequestJson.mapping(node.get("mapping")),
                CollectionRequestJson.rows(node.get("rows")).stream().map(RowRequest::fromJson).toList());
        }
    }
    public record AddRequest(@PositiveOrZero long expectedRevision, @PositiveOrZero long configurationRevision,
            @PositiveOrZero long catalogVersion, boolean warningsConfirmed,
            @NotNull @Size(min = 1, max = 500) List<@NotNull String> headers,
            @NotNull @Size(max = 500) Map<String, String> mapping, @NotNull @Valid RowRequest row) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static AddRequest fromJson(JsonNode node) {
            properties(node, "expectedRevision", "configurationRevision", "catalogVersion", "warningsConfirmed", "headers", "mapping", "row");
            return new AddRequest(number(node.get("expectedRevision")), number(node.get("configurationRevision")), number(node.get("catalogVersion")),
                bool(node.get("warningsConfirmed")), texts(node.get("headers")), CollectionRequestJson.mapping(node.get("mapping")), RowRequest.fromJson(node.get("row")));
        }
    }
    public record EditRequest(@PositiveOrZero long expectedRevision, @PositiveOrZero long configurationRevision,
            @PositiveOrZero long catalogVersion, boolean warningsConfirmed, @NotNull @Size(max = 500) List<@NotNull String> values) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static EditRequest fromJson(JsonNode node) {
            properties(node, "expectedRevision", "configurationRevision", "catalogVersion", "warningsConfirmed", "values");
            return new EditRequest(number(node.get("expectedRevision")), number(node.get("configurationRevision")), number(node.get("catalogVersion")),
                bool(node.get("warningsConfirmed")), texts(node.get("values")));
        }
    }
    public record RestoreRequest(@PositiveOrZero long expectedRevision, @PositiveOrZero long configurationRevision,
            @PositiveOrZero long catalogVersion, boolean warningsConfirmed) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static RestoreRequest fromJson(JsonNode node) {
            properties(node, "expectedRevision", "configurationRevision", "catalogVersion", "warningsConfirmed");
            return new RestoreRequest(number(node.get("expectedRevision")), number(node.get("configurationRevision")), number(node.get("catalogVersion")),
                bool(node.get("warningsConfirmed")));
        }
    }
    public record RevisionRequest(@PositiveOrZero long expectedRevision) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static RevisionRequest fromJson(JsonNode node) {
            properties(node, "expectedRevision");
            return new RevisionRequest(number(node.get("expectedRevision")));
        }
    }
}
