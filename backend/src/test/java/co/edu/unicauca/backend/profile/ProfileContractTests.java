package co.edu.unicauca.backend.profile;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.mock.web.MockHttpServletResponse;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest(properties = {"catalog.sync.enabled=false", "spring.config.import="})
@AutoConfigureMockMvc
class ProfileContractTests {
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @TestConfiguration
    static class FixedTime {
        @Bean @Primary Clock contractClock() {
            return Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
        }
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    private final Map<String, String> generatedIds = new LinkedHashMap<>();

    private static final String INPUT = """
        {"name":"  Contrato preservado  ","version":"  1  ","description":"  Texto original  ",
         "rules":[{"field":" county ","kind":"requiredColumn","severity":"WARNING",
         "condition":"sampling","message":"  Mensaje original  ","source":"  Fuente original  "}]}
        """;

    @Test
    void publicLifecycleAndErrorsKeepExactTransportAndRejectedState() throws Exception {
        probe("catalog", get("/api/catalog"), 200);
        probe("catalog-status", get("/api/catalog/status"), 200);
        probe("seeds", get("/api/profiles"), 200);
        var created = probe("create", post("/api/profiles").contentType("application/json").content(INPUT), 201);
        String id = json.readTree(created.getContentAsString()).get("id").stringValue();
        assertThat(json.readTree(created.getContentAsString()).get("name").stringValue()).isEqualTo("Contrato preservado");
        assertThat(json.readTree(created.getContentAsString()).get("description").stringValue()).isEqualTo("  Texto original  ");
        String edit = INPUT.replace("\"rules\":", "\"revision\":0,\"rules\":");
        probe("update", put("/api/profiles/" + id).contentType("application/json").content(edit), 200);
        rejected("stale", put("/api/profiles/" + id).contentType("application/json").content(edit), 409);
        rejected("unique", post("/api/profiles").contentType("application/json").content(INPUT), 409);
        rejected("publish-space", post("/api/profiles/" + id + "/publish").content(" "), 400);
        rejected("publish-json", post("/api/profiles/" + id + "/publish").contentType("application/json").content("{}"), 400);
        for (String token : List.of("requiredColumn", "WARNING", "sampling")) {
            for (String replacement : List.of("0", "true", "null", "\"unknown\"")) {
                String invalid = INPUT.replace("\"" + token + "\"", replacement);
                rejected("create-enum-" + token + "-" + replacement,
                    post("/api/profiles").contentType("application/json").content(invalid), 400);
                rejected("update-enum-" + token + "-" + replacement,
                    put("/api/profiles/" + id).contentType("application/json")
                        .content(invalid.replace("\"rules\":", "\"revision\":1,\"rules\":")), 400);
            }
        }
        rejected("server-field", post("/api/profiles").contentType("application/json")
            .content(INPUT.replace("\"description\":", "\"status\":\"PUBLISHED\",\"description\":")), 400);
        rejected("missing-revision", put("/api/profiles/" + id).contentType("application/json").content(INPUT), 400);
        rejected("negative-revision", put("/api/profiles/" + id).contentType("application/json")
            .content(edit.replace("\"revision\":0", "\"revision\":-1")), 400);
        probe("publish", post("/api/profiles/" + id + "/publish"), 200);
        rejected("published-update", put("/api/profiles/" + id).contentType("application/json").content(edit), 409);
        rejected("published-publish", post("/api/profiles/" + id + "/publish"), 409);
        probe("duplicate", post("/api/profiles/" + id + "/duplicate").contentType("application/json")
            .content("{\"name\":\"  Copia independiente  \",\"version\":\"  2  \"}"), 201);
        rejected("duplicate-conflict", post("/api/profiles/" + id + "/duplicate").contentType("application/json")
            .content("{\"name\":\"Copia independiente\",\"version\":\"2\"}"), 409);
        rejected("duplicate-invalid", post("/api/profiles/" + id + "/duplicate").contentType("application/json")
            .content("{\"name\":\" \",\"version\":\"2\"}"), 400);
        rejected("missing-profile", post("/api/profiles/missing/publish"), 404);
        rejected("missing-duplicate", post("/api/profiles/missing/duplicate").contentType("application/json")
            .content("{\"name\":\"Copia\",\"version\":\"2\"}"), 404);
        rejected("malformed", post("/api/profiles").contentType("application/json").content("{"), 400);
        rejected("method", delete("/api/profiles"), 405);
        rejected("media-type", post("/api/profiles").contentType("text/plain").content(INPUT), 415);
        rejected("accept", get("/api/profiles").accept("text/plain"), 406);
        probe("final-profiles", get("/api/profiles"), 200);
        probe("final-catalog-status", get("/api/catalog/status"), 200);
    }

    private void rejected(String label, MockHttpServletRequestBuilder request, int expected) throws Exception {
        String before = profiles();
        probe(label, request, expected);
        assertThat(profiles()).as("rejected %s leaves content and revisions unchanged", label).isEqualTo(before);
    }

    private String profiles() throws Exception {
        var response = mvc.perform(get("/api/profiles")).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(200);
        return response.getContentAsString();
    }

    private MockHttpServletResponse probe(String label, MockHttpServletRequestBuilder request, int expected) throws Exception {
        var response = mvc.perform(request).andReturn().getResponse();
        assertThat(response.getStatus()).as(label).isEqualTo(expected);
        String body = response.getContentAsString();
        if (expected == 201) {
            String id = json.readTree(body).get("id").stringValue();
            generatedIds.put(id, "<generated-" + generatedIds.size() + ">");
        }
        for (var entry : generatedIds.entrySet()) body = body.replace(entry.getKey(), entry.getValue());
        var headers = new java.util.TreeMap<String, List<String>>();
        for (String name : response.getHeaderNames()) {
            var values = new ArrayList<>(response.getHeaders(name));
            if (name.equalsIgnoreCase("Allow")) {
                values = new ArrayList<>(List.of(String.join(",", java.util.Arrays.stream(values.getFirst().split(","))
                    .map(String::trim).sorted().toList())));
            }
            headers.put(name, values);
        }
        // A standalone differential runner can compare these exact public observations.
        // No repository history or external files are read by the committed test.
        System.out.println("PROFILE_CONTRACT " + json.writeValueAsString(Map.of(
            "case", label, "status", response.getStatus(), "headers", headers, "body", body)));
        return response;
    }
}
