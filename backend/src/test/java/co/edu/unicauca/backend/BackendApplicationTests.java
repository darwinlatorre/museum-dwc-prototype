package co.edu.unicauca.backend;

import co.edu.unicauca.backend.profile.ProfileBootstrap;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "catalog.sync.enabled=false")
@AutoConfigureMockMvc
class BackendApplicationTests {
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.config.import", () -> "");
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;

    String body(String name, String version) {
        return """
            {"name":"%s","version":"%s","description":"Independent rules",
             "rules":[{"field":"county","kind":"requiredColumn","severity":"WARNING",
             "condition":"sampling","message":"County column needed","source":"Museum"}]}
            """.formatted(name, version);
    }
    JsonNode create() throws Exception {
        return json.readTree(mvc.perform(post("/api/profiles").contentType("application/json")
                .content(body(UUID.randomUUID().toString(), "1.0")))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.revision").value(0)).andReturn().getResponse().getContentAsString());
    }
    String profiles() throws Exception {
        return mvc.perform(get("/api/profiles")).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
    }
    @Test void catalogAndSeedProfilesAreAvailableAndBootstrapIsIdempotent() throws Exception {
        mvc.perform(get("/api/catalog")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").isString()).andExpect(jsonPath("$[0].uri").isString())
            .andExpect(jsonPath("$[0].definition").isString()).andExpect(jsonPath("$[0].category").isString())
            .andExpect(jsonPath("$[0].status").isString());
        assertThat(profiles()).contains("SiB Registros Biológicos", "Museo", "PUBLISHED");
        String before = profiles();
        bootstrap.initialize();
        bootstrap.initialize();
        assertThat(profiles()).isEqualTo(before);
    }
    @Autowired ProfileBootstrap bootstrap;

    @Test void lifecyclePreservesPublishedVersionAndSupportsIndependentDuplicate() throws Exception {
        JsonNode draft = create();
        String id = draft.get("id").asText();
        String edited = body(draft.get("name").asText(), "1.1").replace("\"rules\":", "\"revision\":0,\"rules\":");
        mvc.perform(put("/api/profiles/" + id).contentType("application/json").content(edited))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(1));
        mvc.perform(post("/api/profiles/" + id + "/publish")).andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PUBLISHED")).andExpect(jsonPath("$.revision").value(2));
        String before = profiles();
        mvc.perform(put("/api/profiles/" + id).contentType("application/json").content(edited))
            .andExpect(status().isConflict());
        mvc.perform(post("/api/profiles/" + id + "/publish")).andExpect(status().isConflict());
        assertThat(profiles()).isEqualTo(before);
        mvc.perform(post("/api/profiles/" + id + "/duplicate").contentType("application/json")
                .content("{\"name\":\"" + draft.get("name").asText() + "\",\"version\":\"2.0\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.revision").value(0))
            .andExpect(jsonPath("$.rules[0].condition").value("sampling"))
            .andExpect(jsonPath("$.rules[0].kind").value("requiredColumn"));
        assertThat(profiles()).contains("\"version\":\"1.1\"");
    }
    @Test void invalidRequestsAndStaleRevisionsDoNotChangeAnything() throws Exception {
        JsonNode draft = create();
        String id = draft.get("id").asText();
        String before = profiles();
        String valid = body(draft.get("name").asText(), "1.0");
        for (String invalid : new String[]{valid.replace("requiredColumn", "script"),
                valid.replace("sampling", "eval"), valid.replace("WARNING", "INFO"),
                valid.replace("county", " "), valid.replace("Independent rules", "" )
                    .replace("\"name\":\"" + draft.get("name").asText() + "\"", "\"name\":\" \"")}) {
            mvc.perform(post("/api/profiles").contentType("application/json").content(invalid))
                .andExpect(status().isBadRequest());
            assertThat(profiles()).isEqualTo(before);
        }
        mvc.perform(post("/api/profiles").contentType("application/json").content(valid))
            .andExpect(status().isConflict());
        mvc.perform(put("/api/profiles/" + id).contentType("application/json")
                .content(valid.replace("\"rules\":", "\"revision\":99,\"rules\":")))
            .andExpect(status().isConflict());
        mvc.perform(post("/api/profiles/missing/publish")).andExpect(status().isNotFound());
        assertThat(profiles()).isEqualTo(before);
    }
    @Test void simultaneousEditsAndCreatesHaveExactlyOneWinner() throws Exception {
        JsonNode draft = create();
        String edit = body(draft.get("name").asText(), "1.0")
            .replace("\"rules\":", "\"revision\":0,\"rules\":");
        Callable<Integer> update = () -> mvc.perform(put("/api/profiles/" + draft.get("id").asText())
            .contentType("application/json").content(edit)).andReturn().getResponse().getStatus();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = executor.invokeAll(java.util.List.of(update, update));
            assertThat(java.util.List.of(results.get(0).get(), results.get(1).get()))
                .containsExactlyInAnyOrder(200, 409);
        }
        String same = body(UUID.randomUUID().toString(), "1");
        Callable<Integer> insert = () -> mvc.perform(post("/api/profiles").contentType("application/json")
            .content(same)).andReturn().getResponse().getStatus();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = executor.invokeAll(java.util.List.of(insert, insert));
            assertThat(java.util.List.of(results.get(0).get(), results.get(1).get()))
                .containsExactlyInAnyOrder(201, 409);
        }
    }
    @Test void duplicateAndRenameConflictsLeaveBothVersionsUnchanged() throws Exception {
        JsonNode first = create();
        JsonNode second = create();
        String before = profiles();
        String existing = body(first.get("name").asText(), "1.0");
        mvc.perform(put("/api/profiles/" + second.get("id").asText()).contentType("application/json")
                .content(existing.replace("\"rules\":", "\"revision\":0,\"rules\":")))
            .andExpect(status().isConflict());
        mvc.perform(post("/api/profiles/" + second.get("id").asText() + "/duplicate")
                .contentType("application/json").content("{\"name\":\"" + first.get("name").asText()
                    + "\",\"version\":\"1.0\"}"))
            .andExpect(status().isConflict());
        assertThat(profiles()).isEqualTo(before);
    }
    @Test void allDeclarativeKindsAndConditionsRoundTripWithoutExecution() throws Exception {
        String[] kinds = {"required", "requiredColumn", "date", "latitude", "longitude"};
        String[] conditions = {"always", "collection", "permit", "marine", "permitAndCollection", "sampling"};
        for (String kind : kinds) {
            for (String condition : conditions) {
                String input = body(UUID.randomUUID().toString(), "1")
                    .replace("requiredColumn", kind).replace("sampling", condition);
                mvc.perform(post("/api/profiles").contentType("application/json").content(input))
                    .andExpect(status().isCreated()).andExpect(jsonPath("$.rules[0].kind").value(kind))
                    .andExpect(jsonPath("$.rules[0].condition").value(condition));
            }
        }
    }
    @Test void simultaneousPublishHasOneWinnerAndCannotLoseEdits() throws Exception {
        JsonNode draft = create();
        String id = draft.get("id").asText();
        var ready = new java.util.concurrent.CountDownLatch(2);
        Callable<Integer> publish = () -> {
            ready.countDown();
            assertThat(ready.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            return mvc.perform(post("/api/profiles/" + id + "/publish"))
                .andReturn().getResponse().getStatus();
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = executor.invokeAll(java.util.List.of(publish, publish));
            assertThat(java.util.List.of(results.get(0).get(), results.get(1).get()))
                .containsExactlyInAnyOrder(200, 409);
        }
        JsonNode stored = json.readTree(profiles());
        var matches = new java.util.ArrayList<JsonNode>();
        stored.forEach(profile -> { if (profile.get("id").asText().equals(id)) matches.add(profile); });
        assertThat(matches).hasSize(1);
        assertThat(matches.getFirst().get("revision").asLong()).isEqualTo(1);
        assertThat(matches.getFirst().get("status").asText()).isEqualTo("PUBLISHED");
        assertThat(matches.getFirst().get("rules")).isEqualTo(draft.get("rules"));
    }
    @Test void malformedMissingAndServerOwnedFieldsAreRejectedWithoutWrites() throws Exception {
        JsonNode draft = create();
        String before = profiles();
        String valid = body(UUID.randomUUID().toString(), "1");
        for (String invalid : new String[]{"{}", "{", "null", valid.replace("\"rules\":[", "\"rules\":[null,"),
                valid.replace("\"county\"", "null"), valid.replace("\"version\":\"1\"", "\"version\":\" \""),
                valid.replace("\"description\":", "\"status\":\"PUBLISHED\",\"description\":"),
                valid.replace("\"description\":", "\"id\":\"custom\",\"description\":")}) {
            mvc.perform(post("/api/profiles").contentType("application/json").content(invalid))
                .andExpect(status().isBadRequest());
            assertThat(profiles()).isEqualTo(before);
        }
        mvc.perform(put("/api/profiles/" + draft.get("id").asText()).contentType("application/json")
                .content(valid)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/upload").contentType("application/octet-stream").content("local file"))
            .andExpect(status().isNotFound());
        assertThat(profiles()).isEqualTo(before);
    }
    @ParameterizedTest
    @ValueSource(strings = {"kind", "condition", "severity"})
    void rejectsNumericRuleEnumsWithoutWrites(String field) throws Exception {
        JsonNode draft = create();
        String before = profiles();
        String token = switch (field) {
            case "kind" -> "requiredColumn";
            case "condition" -> "sampling";
            default -> "WARNING";
        };
        String invalid = body(UUID.randomUUID().toString(), "1")
            .replace("\"" + token + "\"", "0");
        mvc.perform(post("/api/profiles").contentType("application/json").content(invalid))
            .andExpect(status().isBadRequest());
        assertThat(profiles()).isEqualTo(before);
        mvc.perform(put("/api/profiles/" + draft.get("id").asText()).contentType("application/json")
                .content(invalid.replace("\"rules\":", "\"revision\":0,\"rules\":")))
            .andExpect(status().isBadRequest());
        assertThat(profiles()).isEqualTo(before);
    }
    static java.util.stream.Stream<byte[]> publicationBodies() {
        return java.util.stream.Stream.concat(
            java.util.stream.Stream.of("{\"revision\":99,\"rules\":[]}", "{}", "null", "\"ignored\"", "[]", "{", " ")
                .map(value -> value.getBytes(java.nio.charset.StandardCharsets.UTF_8)),
            java.util.stream.Stream.of(new byte[]{(byte) 0xff, (byte) 0xfe}));
    }
    @ParameterizedTest
    @MethodSource("publicationBodies")
    void rejectsNonemptyPublicationBodiesWithoutWrites(byte[] content) throws Exception {
        JsonNode draft = create();
        String id = draft.get("id").asText();
        String before = profiles();
        mvc.perform(post("/api/profiles/" + id + "/publish").contentType("application/json").content(content))
            .andExpect(status().isBadRequest());
        assertThat(profiles()).isEqualTo(before);
        mvc.perform(post("/api/profiles/" + id + "/publish").contentType("application/json").content(new byte[0]))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"))
            .andExpect(jsonPath("$.revision").value(1));
    }
    @Test void errorsAreSpanishAndKeepContractsAndStoredProfiles() throws Exception {
        JsonNode draft = create();
        String id = draft.get("id").asText();
        String before = profiles();
        for (String invalid : new String[]{"{}", "{"}) {
            mvc.perform(post("/api/profiles").contentType("application/json").content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Solicitud incorrecta"))
                .andExpect(jsonPath("$.detail").value("El contenido del perfil no es válido."))
                .andExpect(jsonPath("$.status").value(400));
            assertThat(profiles()).isEqualTo(before);
        }
        mvc.perform(post("/api/profiles").contentType("application/json")
                .content(body(draft.get("name").asText(), "1.0")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.title").value("Conflicto"))
            .andExpect(jsonPath("$.detail").value("El nombre y la versión del perfil deben ser únicos; las versiones publicadas son inmutables."));
        mvc.perform(post("/api/profiles/" + id + "/publish").contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail").value("La solicitud de publicación debe tener el cuerpo vacío."));
        mvc.perform(post("/api/profiles/missing/publish"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.title").value("No encontrado"))
            .andExpect(jsonPath("$.detail").value("No se encontró el perfil."));
        mvc.perform(post("/api/upload").contentType("application/octet-stream").content("archivo"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.detail").value("No se encontró el recurso solicitado."));
        mvc.perform(delete("/api/profiles"))
            .andExpect(status().isMethodNotAllowed())
            .andExpect(jsonPath("$.title").value("Método no permitido"))
            .andExpect(header().exists("Allow"));
        assertThat(profiles()).isEqualTo(before);
    }
    @Test void existingPublishedRowsLoadUnchangedAcrossBootstrap() throws Exception {
        String id = UUID.randomUUID().toString();
        String name = UUID.randomUUID().toString();
        String rules = """
            [{"field":"county","kind":"requiredColumn","severity":"WARNING",
            "condition":"sampling","message":"Mensaje histórico","source":"Archivo histórico"}]
            """;
        // Simulate a row persisted before the ORM migration, without using its repository.
        jdbc.update("""
            insert into profiles(id,name,version,status,revision,description,rules)
            values (?,?,'old','PUBLISHED',7,'Descripción histórica',?::jsonb)
            """, id, name, rules);
        String before = profiles();
        JsonNode stored = profile(id);
        assertThat(stored.get("rules")).isEqualTo(json.readTree(rules));
        assertThat(stored.get("revision").asLong()).isEqualTo(7);
        assertThat(stored.get("description").asText()).isEqualTo("Descripción histórica");
        bootstrap.initialize();
        bootstrap.initialize();
        assertThat(profiles()).isEqualTo(before);
    }

    JsonNode profile(String id) throws Exception {
        for (JsonNode profile : json.readTree(profiles())) {
            if (profile.get("id").asText().equals(id)) return profile;
        }
        throw new AssertionError("No se encontró el perfil " + id);
    }

    @Test void staleEditAfterSuccessfulEditLeavesPersistedContentAndRevisionUnchanged() throws Exception {
        JsonNode draft = create();
        String id = draft.get("id").asText();
        String edit = body(draft.get("name").asText(), "1.1")
            .replace("\"rules\":", "\"revision\":0,\"rules\":");
        mvc.perform(put("/api/profiles/" + id).contentType("application/json").content(edit))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(1));
        String before = profiles();
        mvc.perform(put("/api/profiles/" + id).contentType("application/json").content(edit))
            .andExpect(status().isConflict())
            .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
            .andExpect(jsonPath("$.detail").value("La revisión del perfil cambió; actualice los datos antes de guardar."));
        assertThat(profiles()).isEqualTo(before);
    }

    @Test void simultaneousEditAndPublishSerializeWithoutLosingContent() throws Exception {
        JsonNode draft = create();
        String id = draft.get("id").asText();
        String edit = body(draft.get("name").asText(), "1.1")
            .replace("Independent rules", "Contenido editado")
            .replace("\"rules\":", "\"revision\":0,\"rules\":");
        var ready = new java.util.concurrent.CountDownLatch(2);
        Callable<Integer> update = () -> {
            ready.countDown();
            assertThat(ready.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            return mvc.perform(put("/api/profiles/" + id).contentType("application/json").content(edit))
                .andReturn().getResponse().getStatus();
        };
        Callable<Integer> publish = () -> {
            ready.countDown();
            assertThat(ready.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            return mvc.perform(post("/api/profiles/" + id + "/publish"))
                .andReturn().getResponse().getStatus();
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = executor.invokeAll(java.util.List.of(update, publish));
            int editStatus = results.getFirst().get();
            assertThat(editStatus).isIn(200, 409);
            assertThat(results.get(1).get()).isEqualTo(200);
            JsonNode stored = profile(id);
            assertThat(stored.get("status").asText()).isEqualTo("PUBLISHED");
            assertThat(stored.get("revision").asLong()).isEqualTo(editStatus == 200 ? 2 : 1);
            assertThat(stored.get("version").asText()).isEqualTo(editStatus == 200 ? "1.1" : "1.0");
            assertThat(stored.get("description").asText())
                .isEqualTo(editStatus == 200 ? "Contenido editado" : "Independent rules");
            assertThat(stored.get("rules")).isEqualTo(draft.get("rules"));
        }
    }

    @Test void databaseRejectsEveryPublishedMutation() throws Exception {
        JsonNode draft = create();
        String id = draft.get("id").asText();
        mvc.perform(post("/api/profiles/" + id + "/publish")).andExpect(status().isOk());
        String before = profiles();
        assertThatThrownBy(() -> jdbc.update("update profiles set description = 'changed' where id = ?", id))
            .isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(() -> jdbc.update("delete from profiles where id = ?", id))
            .isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThat(profiles()).isEqualTo(before);
    }

    String rowHash() throws Exception {
        String rows = jdbc.queryForObject("select coalesce(jsonb_agg(to_jsonb(p) order by id)::text,'[]') from profiles p", String.class);
        return java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
            .digest(rows.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }
    @Test void verifierConcurrentBootstrapPreservesStoredRows() throws Exception {
        String before = rowHash();
        var ready = new java.util.concurrent.CountDownLatch(2);
        Callable<Void> load = () -> {
            ready.countDown();
            assertThat(ready.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            bootstrap.initialize();
            return null;
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            for (var result : executor.invokeAll(java.util.List.of(load, load))) result.get();
        }
        assertThat(rowHash()).isEqualTo(before);
    }
    @Test void verifierRejectedCommandsPreserveStoredBytesAndBaselineContract() throws Exception {
        String input = body("Verificador independiente", "1.0");
        var created = mvc.perform(post("/api/profiles").contentType("application/json").content(input))
            .andExpect(status().isCreated()).andReturn().getResponse();
        String id = json.readTree(created.getContentAsString()).get("id").asText();
        String before = rowHash();
        var requests = java.util.List.of(
            post("/api/profiles").contentType("application/json").content(input),
            put("/api/profiles/" + id).contentType("application/json").content(input.replace("\"rules\":", "\"revision\":99,\"rules\":")),
            post("/api/profiles/" + id + "/publish").content(" "),
            post("/api/profiles").contentType("application/json").content(input.replace("\"WARNING\"", "0")),
            delete("/api/profiles"));
        int[] statuses = {409,409,400,400,405};
        for (int i = 0; i < requests.size(); i++) {
            var response = mvc.perform(requests.get(i)).andReturn().getResponse();
            assertThat(response.getStatus()).isEqualTo(statuses[i]);
            assertThat(rowHash()).isEqualTo(before);
            System.out.println("VERIFIER_CONTRACT " + response.getStatus() + " " + response.getContentAsString()
                + " Allow=" + response.getHeader("Allow"));
        }
        mvc.perform(post("/api/profiles/" + id + "/publish")).andExpect(status().isOk());
        String published = rowHash();
        assertThat(jdbc.queryForObject("select jsonb_typeof(rules) from profiles where id=?", String.class, id)).isEqualTo("array");
        String independent = "{\"name\":\"Verificador copia\",\"version\":\"2\"}";
        mvc.perform(post("/api/profiles/" + id + "/duplicate").contentType("application/json").content(independent))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.description").value("Independent rules"))
            .andExpect(jsonPath("$.rules[0].message").value("County column needed"));
        String old = jdbc.queryForObject("select to_jsonb(p)::text from profiles p where id=?", String.class, id);
        assertThatThrownBy(() -> jdbc.update("update profiles set rules='[]'::jsonb where id=?", id))
            .isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThat(jdbc.queryForObject("select to_jsonb(p)::text from profiles p where id=?", String.class, id)).isEqualTo(old);
    }
}
