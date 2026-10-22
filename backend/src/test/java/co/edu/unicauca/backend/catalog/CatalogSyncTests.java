package co.edu.unicauca.backend.catalog;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "catalog.sync.enabled=false")
@AutoConfigureMockMvc
@org.junit.jupiter.api.TestMethodOrder(org.junit.jupiter.api.MethodOrderer.OrderAnnotation.class)
class CatalogSyncTests {
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ApplicationContext context;
    @Autowired FakeSource source;
    @Autowired TestClock clock;
    static final String URI = "http://rs.tdwg.org/dwc/terms/syncTest";

    @TestConfiguration
    static class Fakes {
        @Bean @Primary FakeSource fakeSource() { return new FakeSource(); }
        @Bean @Primary TestClock testClock() { return new TestClock(); }
    }
    static class TestClock extends Clock {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
    static class FakeSource implements CatalogSource {
        volatile SourceSet next;
        volatile IOException failure;
        @Override public SourceSet fetch() throws IOException {
            Gate gate;
            synchronized (FakeSource.class) { gate = sourceGate; sourceGate = null; }
            if (gate != null) return gate.fetch();
            if (failure != null) throw failure;
            return next;
        }
    }
    Runnable refresh() { return context.getBean("catalogRefresh", Runnable.class); }
    String getCatalog() throws Exception {
        return mvc.perform(get("/api/catalog")).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
    }
    JsonNode metadata() throws Exception {
        return json.readTree(mvc.perform(get("/api/catalog/status")).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString());
    }
    List<Map<String, String>> terms() throws Exception {
        var result = new ArrayList<Map<String, String>>();
        for (JsonNode term : json.readTree(getCatalog())) {
            var row = new LinkedHashMap<String, String>();
            for (String key : List.of("name", "uri", "definition", "category", "status")) row.put(key, term.get(key).asText());
            result.add(row);
        }
        return result;
    }
    CatalogSource.SourceSet feeds(List<Map<String, String>> terms, String revision) throws IOException {
        var documents = new LinkedHashMap<String, String>();
        for (String path : CatalogSource.PATHS) {
            StringWriter output = new StringWriter();
            try (var csv = new CSVPrinter(output, CSVFormat.RFC4180)) {
                csv.printRecord("term_localName", "term_isDefinedBy", "rdfs_comment", "tdwgutility_organizedInClass", "term_deprecated");
                for (var term : terms) {
                    String uri = term.get("uri");
                    String owner = uri.startsWith("http://purl.org/dc/elements/") ? CatalogSource.PATHS.get(1)
                        : uri.startsWith("http://purl.org/dc/terms/") ? CatalogSource.PATHS.get(2) : CatalogSource.PATHS.getFirst();
                    if (path.equals(owner)) csv.printRecord(term.get("name"), uri.substring(0, uri.length() - term.get("name").length()),
                        term.get("definition"), term.get("category"), term.get("status").equals("deprecated") ? "true" : "");
                }
            }
            documents.put(path, output.toString());
        }
        return new CatalogSource.SourceSet(revision, documents);
    }
    @BeforeEach void prepare() throws Exception {
        source.failure = null;
        source.next = feeds(terms(), "a".repeat(40));
    }
    @Test @org.junit.jupiter.api.Order(0)
    void emptyDatabaseStartsWithTrustedBundleWithoutNetwork() throws Exception {
        assertThat(metadata().get("active").get("revision").asText()).isEqualTo("bundled");
        assertThat(metadata().get("attempts").asInt()).isZero();
        assertThat(terms()).hasSize(414);
        assertThat(terms()).anySatisfy(term -> assertThat(term.get("category")).isEmpty());
    }

    @Test void scheduledEntryPreservesOfficialAttributesAndRecordsDiffs() throws Exception {
        var rows = terms();
        rows.removeIf(t -> t.get("uri").equals(URI));
        rows.add(new LinkedHashMap<>(Map.of("name", "syncTest", "uri", URI, "definition", "Exact, \"quoted\"\nmultiline definition.",
            "category", "", "status", "current")));
        source.next = feeds(rows, "b".repeat(40));
        refresh().run();
        assertThat(getCatalog()).contains("syncTest");
        JsonNode meta = metadata();
        assertThat(meta.get("active").get("revision").asText()).isEqualTo("b".repeat(40));
        assertThat(meta.get("active").get("added").asInt()).isEqualTo(1);
        assertThat(terms().stream().filter(t -> t.get("uri").equals(URI)).findFirst().orElseThrow())
            .containsEntry("category", "").containsEntry("definition", "Exact, \"quoted\"\nmultiline definition.");
        var changed = terms();
        var target = changed.stream().filter(t -> t.get("uri").equals(URI)).findFirst().orElseThrow();
        target.put("definition", "Updated official text");
        target.put("status", "deprecated");
        source.next = feeds(changed, "c".repeat(40));
        refresh().run();
        assertThat(metadata().get("active").get("modified").asInt()).isEqualTo(1);
        assertThat(metadata().get("active").get("deprecated").asInt()).isEqualTo(1);
        assertThat(terms().stream().filter(t -> t.get("uri").equals(URI)).findFirst().orElseThrow())
            .containsEntry("status", "deprecated").containsEntry("definition", "Updated official text");
    }
    @ParameterizedTest
    @ValueSource(strings = {"network", "partial", "empty", "headerOnly", "schema", "unknownStatus", "quote", "shortRow", "missingTerm", "duplicate"})
    void failedCompleteSetLeavesActivePayloadAndSuccessMetadataUnchanged(String failure) throws Exception {
        refresh().run();
        String before = getCatalog();
        JsonNode statusBefore = metadata();
        JsonNode success = statusBefore.get("active");
        var docs = new LinkedHashMap<>(source.next.documents());
        String path = CatalogSource.PATHS.getFirst();
        switch (failure) {
            case "network" -> source.failure = new IOException("Fallo simulado");
            case "partial" -> docs.remove(CatalogSource.PATHS.getLast());
            case "empty" -> docs.put(path, "");
            case "headerOnly" -> docs.put(path, docs.get(path).substring(0, docs.get(path).indexOf('\n') + 1));
            case "schema" -> docs.put(path, docs.get(path).replace("term_localName", "unknown"));
            case "unknownStatus" -> docs.put(path, docs.get(path).replaceFirst(",true", ",unknown"));
            case "quote" -> docs.put(path, docs.get(path) + "\"unfinished");
            case "shortRow" -> docs.put(path, docs.get(path) + "short,row\r\n");
            case "duplicate" -> docs.put(path, docs.get(path) + docs.get(path).substring(docs.get(path).indexOf('\n') + 1));
            case "missingTerm" -> {
                var missing = terms(); missing.removeFirst(); docs = new LinkedHashMap<>(feeds(missing, "d".repeat(40)).documents());
            }
        }
        source.next = new CatalogSource.SourceSet("d".repeat(40), docs);
        refresh().run();
        assertThat(getCatalog()).isEqualTo(before);
        assertThat(metadata().get("active")).isEqualTo(success);
        assertThat(metadata().get("attempts").asLong()).isEqualTo(statusBefore.get("attempts").asLong() + 1);
        assertThat(metadata().get("lastFailure").asText())
            .isEqualTo("No se pudo actualizar el catálogo TDWG; se conserva la última versión válida.");
    }
    @Test void identicalRefreshDoesNotRewriteActiveSnapshot() throws Exception {
        refresh().run();
        String before = getCatalog();
        JsonNode active = metadata().get("active");
        clock.now = clock.now.plusSeconds(100);
        refresh().run();
        assertThat(getCatalog()).isEqualTo(before);
        assertThat(metadata().get("active")).isEqualTo(active);
    }
    @Test void newerAttemptWinsEvenWhenOlderDownloadFinishesLast() throws Exception {
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        var original = source.next;
        source.next = original;
        // The transport boundary, not persistence, is replaced for this race.
        sourceGate = () -> {
            started.countDown();
            try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
            catch (InterruptedException e) { throw new IOException(e); }
            return original;
        };
        try (var executor = Executors.newSingleThreadExecutor()) {
            var older = executor.submit(() -> refresh().run());
            assertThat(started.await(10, TimeUnit.SECONDS)).isTrue();
            source.next = feeds(terms(), "e".repeat(40));
            refresh().run();
            JsonNode active = metadata().get("active");
            release.countDown(); older.get(10, TimeUnit.SECONDS);
            assertThat(metadata().get("active")).isEqualTo(active);
            assertThat(metadata().get("active").get("revision").asText()).isEqualTo("e".repeat(40));
        } finally { sourceGate = null; release.countDown(); }
    }
    @Test void applicationRestartServesPersistedBytesWithoutFetching() throws Exception {
        refresh().run();
        source.failure = new IOException("Sin red durante el reinicio");
        refresh().run();
        String before = getCatalog();
        JsonNode statusBefore = metadata();
        JsonNode active = statusBefore.get("active");
        try (var restarted = new org.springframework.boot.builder.SpringApplicationBuilder(
                co.edu.unicauca.backend.BackendApplication.class, Fakes.class)
                .run("--spring.datasource.url=" + POSTGRES.getJdbcUrl(),
                    "--spring.datasource.username=" + POSTGRES.getUsername(),
                    "--spring.datasource.password=" + POSTGRES.getPassword(),
                    "--catalog.sync.enabled=false", "--server.port=0")) {
            var restartedMvc = org.springframework.test.web.servlet.setup.MockMvcBuilders
                .webAppContextSetup((org.springframework.web.context.WebApplicationContext) restarted).build();
            assertThat(restartedMvc.perform(get("/api/catalog")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).isEqualTo(before);
            var after = json.readTree(restartedMvc.perform(get("/api/catalog/status"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
            assertThat(after).isEqualTo(statusBefore);
            assertThat(after.get("active")).isEqualTo(active);
        }
    }
    @Test void automaticSchedulerDoesNotBlockServingWhileDownloadIsInFlight() throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        var candidate = feeds(terms(), "f".repeat(40));
        String before = getCatalog();
        sourceGate = () -> {
            entered.countDown();
            try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
            catch (InterruptedException exception) { throw new IOException(exception); }
            return candidate;
        };
        try (var scheduled = new org.springframework.boot.builder.SpringApplicationBuilder(
                co.edu.unicauca.backend.BackendApplication.class, Fakes.class)
                .run("--spring.datasource.url=" + POSTGRES.getJdbcUrl(),
                    "--spring.datasource.username=" + POSTGRES.getUsername(),
                    "--spring.datasource.password=" + POSTGRES.getPassword(),
                    "--catalog.sync.enabled=true", "--catalog.sync.initial-delay=0", "--server.port=0")) {
            assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
            var scheduledMvc = org.springframework.test.web.servlet.setup.MockMvcBuilders
                .webAppContextSetup((org.springframework.web.context.WebApplicationContext) scheduled).build();
            assertThat(scheduledMvc.perform(get("/api/catalog")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).isEqualTo(before);
            release.countDown();
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
            while (!metadata().get("active").get("revision").asText().equals(candidate.revision())
                    && System.nanoTime() < deadline) Thread.yield();
            assertThat(metadata().get("active").get("revision").asText()).isEqualTo(candidate.revision());
        } finally { release.countDown(); sourceGate = null; }
    }
    interface Gate { CatalogSource.SourceSet fetch() throws IOException; }
    static volatile Gate sourceGate;
    // Run before later cases introduce synthetic URIs into the shared snapshot.
    @Test @org.junit.jupiter.api.Order(1)
    void officialBytesAndGenerationGuards() throws Exception {
        var docs = new LinkedHashMap<String, String>();
        String[] names = {"terms", "dc", "dcterms"};
        for (int i = 0; i < names.length; i++)
            docs.put(CatalogSource.PATHS.get(i), Files.readString(Path.of("../sources/tdwg/" + names[i] + ".csv")));
        source.next = new CatalogSource.SourceSet("1".repeat(40), docs);
        refresh().run();
        var expected = json.readTree(Files.readString(Path.of("src/main/resources/data/catalog.json")));
        assertThat(json.readTree(getCatalog())).isEqualTo(expected);
        assertThat(metadata().get("active").get("revision").asText()).isEqualTo("1".repeat(40));
        assertThat(expected.size()).isEqualTo(414);
        assertThat(terms().stream().filter(t -> t.get("category").isEmpty()).count()).isEqualTo(52);
        String before = getCatalog();
        var previous = metadata().get("active");
        source.next = new CatalogSource.SourceSet("2".repeat(40), docs);
        refresh().run();
        var active = metadata().get("active");
        assertThat(getCatalog()).isEqualTo(before);
        assertThat(active.get("revision").asText()).isEqualTo("2".repeat(40));
        assertThat(active.get("snapshotVersion").asLong()).isEqualTo(previous.get("snapshotVersion").asLong() + 1);
        for (String key : new String[]{"added", "modified", "deprecated"}) assertThat(active.get(key).asInt()).isZero();
        var store = context.getBean(CatalogStore.class);
        long stale = store.beginAttempt();
        long latest = store.beginAttempt();
        store.fail(latest);
        var failure = metadata().get("lastFailure");
        store.activate(stale, context.getBean(CatalogParser.class).parse(new CatalogSource.SourceSet("3".repeat(40), docs)));
        assertThat(metadata().get("active")).isEqualTo(active);
        store.fail(stale);
        assertThat(metadata().get("lastFailure")).isEqualTo(failure);
        long success = store.beginAttempt();
        store.activate(success, context.getBean(CatalogParser.class).parse(source.next));
        assertThat(metadata().get("lastFailure").isNull()).isTrue();
        store.fail(stale);
        assertThat(metadata().get("lastFailure").isNull()).isTrue();
        assertThat(metadata().get("active")).isEqualTo(active);
        assertThat(getCatalog()).isEqualTo(before);
    }
}
