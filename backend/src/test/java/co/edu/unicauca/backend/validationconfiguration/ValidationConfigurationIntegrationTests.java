package co.edu.unicauca.backend.validationconfiguration;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import jakarta.persistence.EntityManager;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.bootstrap.ConfigurationBootstrap;
import co.edu.unicauca.backend.validationconfiguration.application.port.in.ConfigurationOperations;
import co.edu.unicauca.backend.validationconfiguration.domain.model.ValidationConfiguration;
import co.edu.unicauca.backend.validationconfiguration.domain.exception.ConfigurationValidationException;
import co.edu.unicauca.backend.BackendApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.junit.jupiter.api.BeforeEach;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.IntStream;
import org.springframework.aop.Advisor;
import org.springframework.aop.framework.Advised;
import org.springframework.aop.support.AopUtils;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {"catalog.sync.enabled=false", "spring.config.import="})
@AutoConfigureMockMvc
class ValidationConfigurationIntegrationTests {
    static final String API = "/api/validation-configuration";
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired EntityManager entityManager;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired ConfigurationBootstrap bootstrap;
    @Autowired ConfigurationOperations operations;

    @BeforeEach void resetSeed() throws Exception {
        try (var input = new ClassPathResource("data/validation-configuration.json").getInputStream()) {
            var seed = json.readTree(input);
            mvc.perform(put(API).contentType("application/json").content(json.writeValueAsString(
                Map.of("revision", revision(), "contexts", seed.get("contexts")))))
                .andExpect(status().isOk());
        }
    }

    String configuration() throws Exception {
        return mvc.perform(get(API)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }
    String body(long revision, List<String> fields) {
        return json.writeValueAsString(Map.of("revision", revision, "contexts",
            List.of("collection", "permit", "sampling", "marine", "other").stream()
                .map(context -> Map.of("context", context, "requiredFields", fields)).toList()));
    }
    long revision() throws Exception { return json.readTree(configuration()).get("revision").asLong(); }

    @Test void seedExposesExactFiveContextsAndRequiredMatrix() throws Exception {
        JsonNode config = json.readTree(configuration());
        try (var input = new ClassPathResource("data/validation-configuration.json").getInputStream()) {
            assertThat(config.get("contexts")).isEqualTo(json.readTree(input).get("contexts"));
        }
        var names = new ArrayList<String>();
        var sizes = new ArrayList<Integer>();
        for (JsonNode context : config.get("contexts")) {
            names.add(context.get("context").asText());
            sizes.add(context.get("requiredFields").size());
        }
        assertThat(names).containsExactly("collection", "permit", "sampling", "marine", "other");
        assertThat(sizes).containsExactly(30, 22, 10, 15, 8);
        assertThat(config.get("contexts").get(0).get("requiredFields").toString()).doesNotContain("disposition");
        assertThat(config.get("contexts").get(1).get("requiredFields").toString()).contains("disposition", "individualCount");
    }

    @Test void invalidRequestsLeaveGlobalConfigurationCatalogAndHistoryUnchanged() throws Exception {
        String before = configuration();
        String catalog = catalogState();
        String historical = history();
        String valid = body(revision(), List.of("county"));
        var invalid = new ArrayList<>(List.of("{}", "{", "null", "[]", "true",
            valid.replace("\"collection\"", "0"), valid.replace("\"collection\"", "true"),
            valid.replace("\"collection\"", "null"), valid.replace("\"collection\"", "\"unknown\""),
            valid.replace("\"collection\"", "\"permit\""),
            valid.replace("\"county\"", "0"), valid.replace("\"county\"", "true"),
            valid.replace("\"county\"", "null"), valid.replace("\"county\"", "\" \""),
            valid.replace("\"county\"", "\"\""), valid.replace("\"county\"", "\"county\",\"county\""),
            valid.replace("[\"county\"]", "null"), valid.replace("[\"county\"]", "{}"),
            valid.replace("\"county\"", "\"" + "x".repeat(201) + "\""),
            valid.replace("\"revision\":" + revision(), "\"revision\":-1"),
            valid.replace("\"revision\":" + revision(), "\"revision\":null"),
            valid.replace("\"revision\":" + revision(), "\"revision\":1.5"),
            valid.replace("\"revision\":" + revision(), "\"revision\":\"0\""),
            json.writeValueAsString(Map.of("contexts", json.readTree(valid).get("contexts"))),
            valid.replace("\"contexts\":", "\"extra\":true,\"contexts\":"),
            body(revision(), IntStream.range(0, 501).mapToObj(i -> "f" + i).toList())));
        invalid.add("{\"revision\":" + revision() + ",\"contexts\":[]}");
        invalid.add("{\"revision\":" + revision() + ",\"contexts\":[null,null,null,null,null]}");
        invalid.add("{\"revision\":" + revision() + ",\"contexts\":null}");
        // Missing one context, or adding an unknown sixth, must not become partial updates.
        var parsed = json.readTree(valid);
        var four = new ArrayList<JsonNode>();
        parsed.get("contexts").forEach(four::add);
        four.removeLast();
        invalid.add(json.writeValueAsString(Map.of("revision", revision(), "contexts", four)));
        four.add(parsed.get("contexts").get(4));
        four.add(parsed.get("contexts").get(4));
        invalid.add(json.writeValueAsString(Map.of("revision", revision(), "contexts", four)));
        for (String content : invalid) {
            mvc.perform(put(API).contentType("application/json").content(content))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Solicitud incorrecta"))
                .andExpect(jsonPath("$.detail").value("El contenido de la configuración de validación no es válido."))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.instance").value(API));
            assertThat(configuration()).as(content).isEqualTo(before);
            assertThat(catalogState()).isEqualTo(catalog);
            assertThat(history()).isEqualTo(historical);
        }
    }

    @Test void updatePreservesTextSupportsEmptyListsAndRejectsStaleRevision() throws Exception {
        long revision = revision();
        String input = body(revision, List.of(" county ", "county", "Texto Ω\noriginal"));
        mvc.perform(put(API).contentType("application/json").content(input)).andExpect(status().isOk())
            .andExpect(jsonPath("$.revision").value(revision + 1))
            .andExpect(jsonPath("$.contexts[0].requiredFields[0]").value(" county "));
        String saved = configuration();
        mvc.perform(put(API).contentType("application/json").content(input)).andExpect(status().isConflict())
            .andExpect(jsonPath("$.title").value("Conflicto"))
            .andExpect(jsonPath("$.detail").value("La revisión de la configuración cambió; actualice los datos antes de guardar."))
            .andExpect(jsonPath("$.status").value(409));
        assertThat(configuration()).isEqualTo(saved);
        mvc.perform(put(API).contentType("application/json").content(body(revision + 1, List.of())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(revision + 2))
            .andExpect(jsonPath("$.contexts[0].requiredFields").isEmpty());
    }

    @Test void exactMaximumFieldAndArrayLengthsRoundTrip() throws Exception {
        var fields = IntStream.range(0, 500)
            .mapToObj(i -> ("f" + i).repeat(100).substring(0, 200)).toList();
        String request = body(revision(), fields);
        var response = mvc.perform(put(API).contentType("application/json").content(request))
            .andExpect(status().isOk()).andReturn().getResponse();
        assertThat(json.readTree(response.getContentAsString()).get("contexts"))
            .isEqualTo(json.readTree(request).get("contexts"));
    }

    @Test void concurrentClientsHaveExactlyOneWinnerWithoutLostUpdate() throws Exception {
        long revision = revision();
        var ready = new CountDownLatch(2);
        Callable<Integer> first = update(ready, body(revision, List.of("first")));
        Callable<Integer> second = update(ready, body(revision, List.of("second")));
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = executor.invokeAll(List.of(first, second));
            int a = results.getFirst().get();
            int b = results.getLast().get();
            assertThat(List.of(a, b)).containsExactlyInAnyOrder(200, 409);
            var saved = json.readTree(configuration());
            assertThat(saved.get("revision").asLong()).isEqualTo(revision + 1);
            assertThat(saved.get("contexts")).isEqualTo(json.readTree(body(revision, List.of(a == 200 ? "first" : "second"))).get("contexts"));
        }
    }
    Callable<Integer> update(CountDownLatch ready, String body) {
        return () -> {
            ready.countDown();
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            return mvc.perform(put(API).contentType("application/json").content(body)).andReturn().getResponse().getStatus();
        };
    }

    @Test void retiredRoutesAndUploadReturn404AndProtocolErrorsArePreserved() throws Exception {
        String before = configuration();
        for (String path : List.of("/api/profiles", "/api/profiles/old", "/api/profiles/old/publish", "/api/profiles/old/duplicate", "/api/upload")) {
            mvc.perform(get(path)).andExpect(status().isNotFound());
            mvc.perform(post(path).contentType("application/json").content("{}"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.detail").value("No se encontró el recurso solicitado."));
        }
        mvc.perform(delete(API)).andExpect(status().isMethodNotAllowed()).andExpect(header().exists("Allow"));
        mvc.perform(put(API).contentType("text/plain").content("{}"))
            .andExpect(status().isUnsupportedMediaType());
        mvc.perform(get(API).accept("text/plain")).andExpect(status().isNotAcceptable());
        assertThat(configuration()).isEqualTo(before);
    }

    String catalogState() throws Exception {
        return mvc.perform(get("/api/catalog")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()
            + mvc.perform(get("/api/catalog/status")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }
    String history() {
        return new TransactionTemplate(transactionManager).execute(status ->
            (String) entityManager.createNativeQuery("select jsonb_agg(to_jsonb(p) order by installed_rank)::text from flyway_schema_history p", String.class).getSingleResult());
    }

    @Test void concurrentBootstrapAndRestartPreserveEditedConfiguration() throws Exception {
        mvc.perform(put(API).contentType("application/json").content(body(revision(), List.of(" campo Ω "))))
            .andExpect(status().isOk());
        String before = configuration();
        var ready = new CountDownLatch(2);
        Callable<Void> load = () -> {
            ready.countDown();
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            bootstrap.initialize();
            return null;
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            for (var result : executor.invokeAll(List.of(load, load))) result.get();
        }
        assertThat(configuration()).isEqualTo(before);
        try (var restarted = new SpringApplicationBuilder(BackendApplication.class).run(
                "--spring.datasource.url=" + POSTGRES.getJdbcUrl(),
                "--spring.datasource.username=" + POSTGRES.getUsername(),
                "--spring.datasource.password=" + POSTGRES.getPassword(),
                "--spring.config.import=", "--catalog.sync.enabled=false", "--server.port=0")) {
            var restartedMvc = MockMvcBuilders.webAppContextSetup((WebApplicationContext) restarted).build();
            assertThat(restartedMvc.perform(get(API)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).isEqualTo(before);
        }
    }

    @Test void everyContextRejectsInvalidFieldTypesAndLengthsWithoutMutation() throws Exception {
        String before = configuration();
        var keys = List.of("collection", "permit", "sampling", "marine", "other");
        for (int target = 0; target < keys.size(); target++) {
            for (Object fields : List.of(List.of(1), List.of(true), Arrays.asList((String) null),
                    List.of(""), List.of("\u2003"), List.of("x", "x"), List.of("x".repeat(201)),
                    IntStream.range(0, 501).mapToObj(i -> "f" + i).toList())) {
                var contexts = new ArrayList<Map<String, Object>>();
                for (int index = 0; index < keys.size(); index++) {
                    contexts.add(Map.of("context", keys.get(index), "requiredFields", index == target ? fields : List.of()));
                }
                String input = json.writeValueAsString(Map.of("revision", revision(), "contexts", contexts));
                var response = mvc.perform(put(API).contentType("application/json").content(input))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.detail").value("El contenido de la configuración de validación no es válido."))
                    .andReturn().getResponse();
                assertThat(response.getContentAsString()).doesNotContain("SQL", "Exception", "constraint", "org.postgresql");
                assertThat(configuration()).isEqualTo(before);
            }
        }
    }

    @Test void operationBoundaryIsOneTransactionalProxy() {
        assertThat(AopUtils.isAopProxy(operations)).isTrue();
        var advised = (Advised) operations;
        var interceptor = Arrays.stream(advised.getAdvisors()).map(Advisor::getAdvice)
            .filter(TransactionInterceptor.class::isInstance)
            .map(TransactionInterceptor.class::cast).findFirst().orElseThrow();
        for (var method : ConfigurationOperations.class.getMethods()) {
            var attribute = interceptor.getTransactionAttributeSource().getTransactionAttribute(method,
                AopUtils.getTargetClass(operations));
            assertThat(attribute).isNotNull();
            assertThat(attribute.isReadOnly()).isEqualTo(method.getName().equals("get"));
            assertThat(attribute.getPropagationBehavior()).isEqualTo(0);
        }
    }

    @Test void rollbackAfterAFlushedUpdatePreservesPublicState() throws Exception {
        String before = configuration();
        var current = operations.get();
        assertThatThrownBy(() -> new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            operations.update(current);
            throw new IllegalStateException("fallo después del flush");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(configuration()).isEqualTo(before);
    }

    @Test void invalidCoreUpdateAndSeedRollBackWithoutWrites() throws Exception {
        String before = configuration();
        assertThatThrownBy(() -> operations.update(new ValidationConfiguration(revision(), List.of())))
            .isInstanceOf(ConfigurationValidationException.class);
        assertThatThrownBy(() -> operations.initialize(new ValidationConfiguration(0, List.of())))
            .isInstanceOf(ConfigurationValidationException.class);
        assertThat(configuration()).isEqualTo(before);
    }
}
