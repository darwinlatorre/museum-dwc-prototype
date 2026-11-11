package co.edu.unicauca.backend.collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.mockito.Mockito;
import co.edu.unicauca.backend.collections.domain.model.CollectionFailure;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.entity.CollectionImportEntity;
import co.edu.unicauca.backend.collections.infrastructure.adapter.out.database.repository.CollectionImportRepository;

@SpringBootTest(properties = {"catalog.sync.enabled=false", "spring.config.import="})
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
class CollectionHttpTests {
    static final String API = "/api/collections";
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoSpyBean CollectionImportRepository importRepository;
    long configurationRevision;
    long catalogVersion;

    @BeforeEach void configuration() throws Exception {
        long revision = read("/api/validation-configuration").get("revision").asLong();
        configurationRevision = json.readTree(mvc.perform(put("/api/validation-configuration")
            .contentType("application/json").content(json.writeValueAsString(Map.of("revision", revision,
                "contexts", List.of("collection", "permit", "sampling", "marine", "other").stream()
                    .map(context -> Map.of("context", context, "requiredFields", List.of(), "optionalFields", List.of())).toList()))))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("revision").asLong();
        catalogVersion = read("/api/catalog/status").get("active").get("snapshotVersion").asLong();
    }
    JsonNode read(String uri) throws Exception {
        return json.readTree(mvc.perform(get(uri)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
    Map<String, Object> command(List<String> headers, List<List<String>> values) {
        var request = new LinkedHashMap<String, Object>();
        request.put("collectionId", null);
        request.put("name", "Colección " + UUID.randomUUID());
        request.put("context", "other");
        request.put("expectedRevision", null);
        request.put("configurationRevision", configurationRevision);
        request.put("catalogVersion", catalogVersion);
        request.put("idempotencyKey", UUID.randomUUID().toString());
        request.put("warningsConfirmed", true);
        request.put("headers", headers);
        request.put("mapping", Map.of());
        var rows = new ArrayList<Map<String, Object>>();
        for (int i = 0; i < values.size(); i++) rows.add(Map.of("sourceRow", i + 2,
            "originalValues", values.get(i), "values", values.get(i)));
        request.put("rows", rows);
        return request;
    }
    JsonNode submit(Map<String, Object> request, int statusCode) throws Exception {
        return json.readTree(mvc.perform(post(API + "/imports").contentType("application/json")
            .content(json.writeValueAsString(request))).andExpect(status().is(statusCode))
            .andReturn().getResponse().getContentAsString());
    }
    Map<String, Object> append(String id, long revision, List<String> headers, List<List<String>> values) {
        var request = command(headers, values);
        request.put("collectionId", id);
        request.put("name", null);
        request.put("expectedRevision", revision);
        return request;
    }
    String state(String id) throws Exception {
        return read(API + "/" + id).toString() + read(API + "/" + id + "/records?trash=ALL").toString();
    }
    void rejectUnchanged(Map<String, Object> request, String id, int statusCode, String code) throws Exception {
        String before = state(id);
        var error = submit(request, statusCode);
        assertThat(error.get("code").asString()).isEqualTo(code);
        assertThat(error.get("status").asInt()).isEqualTo(statusCode);
        assertThat(error.get("instance").asString()).isEqualTo(API + "/imports");
        assertThat(error.get("title").asString()).isEqualTo(statusCode == 409 ? "Conflicto" : statusCode == 422 ? "Validación pendiente" : "Solicitud incorrecta");
        assertThat(error.get("detail").asString()).isEqualTo(switch (code) {
            case "DUPLICATE" -> "La operación contiene registros duplicados dentro de esta colección.";
            case "IDEMPOTENCY_CONFLICT" -> "La clave de importación ya se utilizó con otra solicitud.";
            case "REVISION_CONFLICT" -> "La revisión de la colección cambió; actualice los datos antes de guardar.";
            case "CONFIGURATION_CHANGED" -> "La configuración de validación cambió; vuelva a analizar los datos.";
            case "CATALOG_CHANGED" -> "El catálogo TDWG cambió; vuelva a analizar los datos.";
            case "VALIDATION_FAILED" -> "Los errores de validación impiden guardar los registros.";
            case "WARNINGS_UNCONFIRMED" -> "Confirme las advertencias antes de guardar los registros.";
            case "INVALID_MAPPING" -> "Dos columnas de origen no pueden asignarse al mismo campo.";
            default -> "El contenido de la solicitud no es válido.";
        });
        assertThat(state(id)).isEqualTo(before);
    }

    @Test void listAndPagingHaveBoundedPublicContract() throws Exception {
        submit(command(List.of("occurrenceID"), List.of(List.of(UUID.randomUUID().toString()))), 201);
        assertThat(read(API + "?size=1").get("items").size()).isEqualTo(1);
        String before = read(API).toString();
        for (String query : List.of("size=201", "page=-1", "size=0")) {
            mvc.perform(get(API + "?" + query)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("La paginación no es válida."));
        }
        assertThat(read(API).toString()).isEqualTo(before);
    }

    @Test void literalValuesProvenanceMappingAndIdempotencyAreDurable() throws Exception {
        var request = command(List.of(" ID ", "arbitrario"), List.of(List.of(" 0001 ", "AbC \n ")));
        request.put("mapping", Map.of(" ID ", "occurrenceID"));
        var result = submit(request, 201);
        String id = result.get("collectionId").asString();
        String before = state(id);
        assertThat(submit(request, 201)).isEqualTo(result);
        assertThat(state(id)).isEqualTo(before);
        var record = read(API + "/" + id + "/records").get("items").get(0);
        assertThat(record.get("headers").get(0).asString()).isEqualTo(" ID ");
        assertThat(record.get("mapping").get(" ID ").asString()).isEqualTo("occurrenceID");
        assertThat(record.get("values").get(0).asString()).isEqualTo(" 0001 ");
        assertThat(record.get("originalValues").get(1).asString()).isEqualTo("AbC \n ");
        request.put("name", "Otra identidad");
        rejectUnchanged(request, id, 409, "IDEMPOTENCY_CONFLICT");
        var fresh = append(id, 1, List.of("occurrenceID"), List.of(List.of("0001"), List.of("0001 "), List.of("0001a"), List.of("0001A")));
        submit(fresh, 201);
    }

    @Test void duplicatesBlockWholeBatchOnlyWithinCollection() throws Exception {
        var first = command(List.of("occurrenceID", "locality"), List.of(List.of("001", " A ")));
        String id = submit(first, 201).get("collectionId").asString();
        rejectUnchanged(append(id, 1, List.of("locality", "occurrenceID"),
            List.of(List.of("otro", "002"), List.of(" A ", "001"))), id, 409, "DUPLICATE");
        rejectUnchanged(append(id, 1, List.of("locality"), List.of(List.of("igual"), List.of("igual"))), id, 409, "DUPLICATE");
        rejectUnchanged(append(id, 1, List.of("occurrenceID", "locality"),
            List.of(List.of("002", "x"), List.of("002", "y"))), id, 409, "DUPLICATE");
        submit(command(List.of("occurrenceID", "locality"), List.of(List.of("001", " A "))), 201);
        // Empty IDs are not duplicate IDs; full rows still are.
        submit(append(id, 1, List.of("occurrenceID", "locality"), List.of(List.of(" ", "x"), List.of(" ", "y"))), 201);
    }

    @Test void invalidRowsWarningsAndStaleSnapshotsLeaveEverythingUnchanged() throws Exception {
        String id = submit(command(List.of("occurrenceID"), List.of(List.of("one"))), 201).get("collectionId").asString();
        var invalid = append(id, 1, List.of("occurrenceID", "eventDate"),
            List.of(List.of("valid", "2024-02-29"), List.of("invalid", "2023-02-29")));
        rejectUnchanged(invalid, id, 422, "VALIDATION_FAILED");
        var warning = append(id, 1, List.of("campo libre"), List.of(List.of("texto")));
        warning.put("warningsConfirmed", false);
        rejectUnchanged(warning, id, 422, "WARNINGS_UNCONFIRMED");
        warning.put("warningsConfirmed", true);
        warning.put("configurationRevision", configurationRevision - 1);
        rejectUnchanged(warning, id, 409, "CONFIGURATION_CHANGED");
        warning.put("configurationRevision", configurationRevision);
        warning.put("catalogVersion", catalogVersion + 1);
        rejectUnchanged(warning, id, 409, "CATALOG_CHANGED");
        warning.put("catalogVersion", catalogVersion);
        warning.put("expectedRevision", 0);
        rejectUnchanged(warning, id, 409, "REVISION_CONFLICT");
        warning.put("expectedRevision", 1);
        submit(warning, 201);
    }

    @Test void malformedNewImportDoesNotCreateCollectionOrReceipt() throws Exception {
        String before = read(API).toString();
        var request = command(List.of("eventDate"), List.of(List.of("invalid")));
        assertThat(submit(request, 422).get("code").asString()).isEqualTo("VALIDATION_FAILED");
        assertThat(read(API).toString()).isEqualTo(before);
        request.put("rows", List.of(Map.of("sourceRow", 2, "originalValues", List.of("invalid"), "values", List.of("2024"))));
        submit(request, 201); // A rejected request did not reserve its idempotency key.
    }

    @Test void crudTrashAndRestoreRevalidateAndRejectCollisions() throws Exception {
        String id = submit(command(List.of("occurrenceID", "eventDate"), List.of(List.of("a", "2024"))), 201).get("collectionId").asString();
        String rowId = read(API + "/" + id + "/records").get("items").get(0).get("id").asString();
        String uri = API + "/" + id + "/records/" + rowId;
        var write = new LinkedHashMap<String, Object>(Map.of("expectedRevision", 1, "configurationRevision", configurationRevision,
            "catalogVersion", catalogVersion, "warningsConfirmed", true, "values", List.of("b", "2024-02")));
        mvc.perform(put(uri).contentType("application/json").content(json.writeValueAsString(write)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(2));
        assertThat(read(uri).get("originalValues").get(0).asString()).isEqualTo("a");
        assertThat(read(uri).get("values").get(0).asString()).isEqualTo("b");
        var revision = Map.of("expectedRevision", 2);
        mvc.perform(post(uri + "/trash").contentType("application/json").content(json.writeValueAsString(revision)))
            .andExpect(status().isOk());
        assertThat(read(API + "/" + id + "/records").get("totalElements").asLong()).isZero();
        assertThat(read(API + "/" + id + "/records?trash=TRASHED").get("totalElements").asLong()).isEqualTo(1);
        var add = Map.of("expectedRevision", 3, "configurationRevision", configurationRevision, "catalogVersion", catalogVersion,
            "warningsConfirmed", true, "headers", List.of("occurrenceID", "eventDate"), "mapping", Map.of(),
            "row", Map.of("sourceRow", 1, "originalValues", List.of("b", "2024-02"), "values", List.of("b", "2024-02")));
        mvc.perform(post(API + "/" + id + "/records").contentType("application/json").content(json.writeValueAsString(add)))
            .andExpect(status().isCreated());
        String before = state(id);
        write.put("expectedRevision", 4);
        write.remove("values");
        mvc.perform(post(uri + "/restore").contentType("application/json").content(json.writeValueAsString(write)))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DUPLICATE"));
        assertThat(state(id)).isEqualTo(before);
        String replacement = read(API + "/" + id + "/records").get("items").get(0).get("id").asString();
        mvc.perform(post(API + "/" + id + "/records/" + replacement + "/trash").contentType("application/json")
            .content("{\"expectedRevision\":4}")).andExpect(status().isOk());
        write.put("expectedRevision", 5);
        mvc.perform(post(uri + "/restore").contentType("application/json").content(json.writeValueAsString(write)))
            .andExpect(status().isOk());
        before = state(id);
        write.put("values", List.of("c", "bad"));
        write.put("expectedRevision", 6);
        mvc.perform(put(uri).contentType("application/json").content(json.writeValueAsString(write)))
            .andExpect(status().isUnprocessableContent()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        assertThat(state(id)).isEqualTo(before);
        mvc.perform(delete(API + "/" + id)).andExpect(status().isMethodNotAllowed());
    }

    @Test void concurrentImportsAndDoubleConfirmationHaveOneDurableWinner() throws Exception {
        String id = submit(command(List.of("occurrenceID"), List.of(List.of("initial"))), 201).get("collectionId").asString();
        var a = append(id, 1, List.of("occurrenceID"), List.of(List.of("race")));
        var b = append(id, 1, List.of("occurrenceID"), List.of(List.of("race")));
        assertThat(race(a, b)).containsExactlyInAnyOrder(201, 409);
        assertThat(read(API + "/" + id + "/records").get("totalElements").asLong()).isEqualTo(2);
        var same = command(List.of("occurrenceID"), List.of(List.of("confirmation")));
        assertThat(race(same, same)).containsExactly(201, 201);
        var result = submit(same, 201);
        assertThat(read(API + "/" + result.get("collectionId").asString()).get("activeCount").asLong()).isEqualTo(1);
    }
    @Test void currentRequiredPolicyAndRestoreAreAuthoritative() throws Exception {
        String id = submit(command(List.of("occurrenceID"), List.of(List.of("policy"))), 201).get("collectionId").asString();
        String recordId = read(API + "/" + id + "/records").get("items").get(0).get("id").asString();
        String uri = API + "/" + id + "/records/" + recordId;
        mvc.perform(post(uri + "/trash").contentType("application/json").content("{\"expectedRevision\":1}"))
            .andExpect(status().isOk());
        configurationRevision = json.readTree(mvc.perform(put("/api/validation-configuration").contentType("application/json")
            .content(json.writeValueAsString(Map.of("revision", configurationRevision, "contexts",
                List.of("collection", "permit", "sampling", "marine", "other").stream()
                    .map(context -> Map.of("context", context, "requiredFields", List.of("county"), "optionalFields", List.of("locality"))).toList()))))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("revision").asLong();
        var missing = append(id, 2, List.of("occurrenceID"), List.of(List.of("new")));
        String before = state(id);
        var failure = submit(missing, 422);
        assertThat(failure.get("detail").asString()).isEqualTo("Los errores de validación impiden guardar los registros.");
        assertThat(failure.get("issues").get(0).get("description").asString()).isEqualTo("county es obligatorio en este contexto.");
        assertThat(failure.get("issues").get(0).get("row").isNull()).isTrue();
        assertThat(state(id)).isEqualTo(before);
        mvc.perform(post(uri + "/restore").contentType("application/json").content(json.writeValueAsString(Map.of(
            "expectedRevision", 2, "configurationRevision", configurationRevision, "catalogVersion", catalogVersion, "warningsConfirmed", true))))
            .andExpect(status().isUnprocessableContent()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        assertThat(state(id)).isEqualTo(before);
        submit(append(id, 2, List.of("occurrenceID", "county"), List.of(List.of("new", "  válido  "))), 201);
        rejectUnchanged(append(id, 3, List.of("county"), List.of(List.of("\u00a0"))), id, 422, "VALIDATION_FAILED");
    }

    @Test void strictJsonRejectsCoercionUnknownPropertiesAndBadShapesWithoutEffects() throws Exception {
        String id = submit(command(List.of("occurrenceID"), List.of(List.of("strict"))), 201).get("collectionId").asString();
        String before = state(id);
        String valid = json.writeValueAsString(append(id, 1, List.of("occurrenceID"), List.of(List.of("candidate"))));
        for (String body : List.of(valid.replace("\"candidate\"", "123"), valid.replace("\"candidate\"", "null"),
                valid.replace("\"warningsConfirmed\":true", "\"warningsConfirmed\":\"true\""),
                valid.replace("\"expectedRevision\":1", "\"expectedRevision\":1.0"),
                valid.replace("\"expectedRevision\":1", "\"expectedRevision\":\"1\""),
                valid.replace("\"context\":\"other\"", "\"context\":\"OTHER\""),
                valid.replace("\"headers\":", "\"file\":\"no\",\"headers\":"), "null", "{}")) {
            mvc.perform(post(API + "/imports").contentType("application/json").content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("El contenido de la solicitud no es válido."));
            assertThat(state(id)).isEqualTo(before);
        }
        rejectUnchanged(append(id, 1, List.of("a", "b"), List.of(List.of("short"))), id, 400, "INVALID_REQUEST");
        var ambiguous = append(id, 1, List.of("a", "b"), List.of(List.of("1", "2")));
        ambiguous.put("mapping", Map.of("a", "occurrenceID", "b", "occurrenceID"));
        rejectUnchanged(ambiguous, id, 400, "INVALID_MAPPING");
        var oversized = append(id, 1, List.of("occurrenceID"), List.of(List.of("x".repeat(100001))));
        mvc.perform(post(API + "/imports").contentType("application/json").content(json.writeValueAsString(oversized)))
            .andExpect(status().isBadRequest());
        assertThat(state(id)).isEqualTo(before);
    }

    @Test void fullMappedRowsDuplicatesIgnoreSourceColumnOrderAndRecordPagingIsStable() throws Exception {
        String id = submit(command(List.of("locality", "county"), List.of(List.of("x", "y"))), 201).get("collectionId").asString();
        var duplicate = append(id, 1, List.of("county original", "locality"), List.of(List.of("y", "x")));
        duplicate.put("mapping", Map.of("county original", "county"));
        rejectUnchanged(duplicate, id, 409, "DUPLICATE");
        submit(append(id, 1, List.of("locality", "county"), List.of(List.of("x", "Y"), List.of(" x", "y"))), 201);
        var first = read(API + "/" + id + "/records?size=1&page=0");
        var second = read(API + "/" + id + "/records?size=1&page=1");
        assertThat(first.get("totalElements").asLong()).isEqualTo(3);
        assertThat(first.get("items").get(0).get("id")).isNotEqualTo(second.get("items").get(0).get("id"));
        assertThat(read(API + "/" + id + "/records?size=1&page=3").get("items").isEmpty()).isTrue();
        String before = state(id);
        mvc.perform(get(API + "/" + id + "/records?trash=unknown")).andExpect(status().isBadRequest());
        assertThat(state(id)).isEqualTo(before);
    }

    @Test void rejectsOversizedTransportBeforeParsingOrWriting() throws Exception {
        String before = read(API).toString();
        mvc.perform(post(API + "/imports").contentType("application/json").content(" ".repeat(32 * 1024 * 1024 + 1)))
            .andExpect(status().isContentTooLarge()).andExpect(jsonPath("$.code").value("PAYLOAD_TOO_LARGE"));
        assertThat(read(API).toString()).isEqualTo(before);
    }

    @Test void lateFailureAfterFlushedRowsRollsBackCollectionRecordsRevisionAndReceipt() throws Exception {
        String id = submit(command(List.of("occurrenceID"), List.of(List.of("rollback-base"))), 201).get("collectionId").asString();
        String before = state(id);
        String listBefore = read(API).toString();
        var request = append(id, 1, List.of("occurrenceID"), List.of(List.of("rollback-new")));
        var newCollection = command(List.of("occurrenceID"), List.of(List.of("rollback-create")));
        Mockito.doThrow(new CollectionFailure("DUPLICATE")).when(importRepository).saveAndFlush(Mockito.any(CollectionImportEntity.class));
        try {
            submit(request, 409);
            submit(newCollection, 409);
            assertThat(state(id)).isEqualTo(before);
            assertThat(read(API).toString()).isEqualTo(listBefore);
        } finally { Mockito.reset(importRepository); }
        submit(request, 201);
        submit(newCollection, 201);
    }

    @Test void concurrentRecordEditsDoNotLoseUpdatesAndStaleTrashHasNoEffects() throws Exception {
        String id = submit(command(List.of("occurrenceID"), List.of(List.of("edit-base"))), 201).get("collectionId").asString();
        String rowId = read(API + "/" + id + "/records").get("items").get(0).get("id").asString();
        String uri = API + "/" + id + "/records/" + rowId;
        var gate = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var futures = List.of("edit-a", "edit-b").stream().map(value -> executor.submit((Callable<Integer>) () -> {
                gate.await(10, TimeUnit.SECONDS);
                return mvc.perform(put(uri).contentType("application/json").content(json.writeValueAsString(Map.of(
                    "expectedRevision", 1, "configurationRevision", configurationRevision, "catalogVersion", catalogVersion,
                    "warningsConfirmed", true, "values", List.of(value))))).andReturn().getResponse().getStatus();
            })).toList();
            gate.countDown();
            assertThat(List.of(futures.get(0).get(30, TimeUnit.SECONDS), futures.get(1).get(30, TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(200, 409);
        }
        assertThat(read(API + "/" + id).get("revision").asLong()).isEqualTo(2);
        assertThat(read(uri).get("values").get(0).asString()).isIn("edit-a", "edit-b");
        assertThat(read(uri).get("originalValues").get(0).asString()).isEqualTo("edit-base");
        String before = state(id);
        mvc.perform(post(uri + "/trash").contentType("application/json").content("{\"expectedRevision\":1}"))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("REVISION_CONFLICT"));
        assertThat(state(id)).isEqualTo(before);
    }

    @Test void addAndEditCannotIntroduceDuplicatesAndRejectWithoutChangingOriginals() throws Exception {
        String id = submit(command(List.of("occurrenceID", "locality"), List.of(List.of("a", "x"), List.of("b", "y"))), 201)
            .get("collectionId").asString();
        var records = read(API + "/" + id + "/records").get("items");
        JsonNode target = records.get(0).get("values").get(0).asString().equals("b") ? records.get(0) : records.get(1);
        String uri = API + "/" + id + "/records/" + target.get("id").asString();
        String before = state(id);
        mvc.perform(put(uri).contentType("application/json").content(json.writeValueAsString(Map.of(
            "expectedRevision", 1, "configurationRevision", configurationRevision, "catalogVersion", catalogVersion,
            "warningsConfirmed", true, "values", List.of("a", "different")))))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DUPLICATE"));
        assertThat(state(id)).isEqualTo(before);
        mvc.perform(post(API + "/" + id + "/records").contentType("application/json").content(json.writeValueAsString(Map.of(
            "expectedRevision", 1, "configurationRevision", configurationRevision, "catalogVersion", catalogVersion,
            "warningsConfirmed", true, "headers", List.of("occurrenceID", "locality"), "mapping", Map.of(),
            "row", Map.of("sourceRow", 1, "originalValues", List.of("a", "x"), "values", List.of("a", "x"))))))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("DUPLICATE"));
        assertThat(state(id)).isEqualTo(before);
    }

    List<Integer> race(Map<String, Object> a, Map<String, Object> b) throws Exception {
        var gate = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var futures = List.of(a, b).stream().map(request -> executor.submit((Callable<Integer>) () -> {
                gate.await(10, TimeUnit.SECONDS);
                return mvc.perform(post(API + "/imports").contentType("application/json").content(json.writeValueAsString(request)))
                    .andReturn().getResponse().getStatus();
            })).toList();
            gate.countDown();
            return List.of(futures.get(0).get(30, TimeUnit.SECONDS), futures.get(1).get(30, TimeUnit.SECONDS));
        }
    }
}
