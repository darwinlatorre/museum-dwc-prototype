package co.edu.unicauca.backend.shared.infrastructure.config;

import co.edu.unicauca.backend.shared.infrastructure.adapter.in.web.exception.ApiExceptionHandler;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockServletContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ApiCorsTest {
    private static final String API = "/api/validation-configuration";
    private static final String ORIGIN = "http://localhost:4200";
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;
    private FixtureController controller;

    @BeforeEach
    void setUp() throws Exception {
        start(null);
    }

    @AfterEach
    void close() {
        context.close();
    }

    private void start(String origins) throws Exception {
        if (context != null) {
            context.close();
        }
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        for (var source : new YamlPropertySourceLoader().load("application", new ClassPathResource("application.yaml"))) {
            context.getEnvironment().getPropertySources().addLast(source);
        }
        if (origins != null) {
            context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test",
                Map.of("cors.allowed-origins", origins)));
        }
        context.register(Fixture.class);
        context.refresh();
        controller = context.getBean(FixtureController.class);
        mvc = MockMvcBuilders.webAppContextSetup(context)
            .defaultRequest(get("/").with(request -> {
                request.setServerName("api.local");
                return request;
            }))
            .build();
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://localhost:4200", "http://localhost:8081", "http://localhost",
        "http://127.0.0.1:4200", "http://127.0.0.1:8081", "http://127.0.0.1"})
    void defaultOriginsAllowJsonPutPreflight(String origin) throws Exception {
        mvc.perform(preflight(API, origin, "PUT", "Content-Type"))
            .andExpect(status().isOk())
            .andExpect(content().string(""))
            .andExpect(header().string("Access-Control-Allow-Origin", origin))
            .andExpect(header().string("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT"))
            .andExpect(header().string("Access-Control-Allow-Headers", "Content-Type"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
        assertThat(controller.writes.get()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"GET", "HEAD", "POST"})
    void otherRequiredMethodsHaveValidPreflight(String method) throws Exception {
        mvc.perform(preflight(method.equals("POST") ? "/api/catalog/sync" : API, ORIGIN, method, "Content-Type"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN));
        assertThat(controller.writes.get()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"https://evil.example", "null", "http://localhost:4201", "http://localhost.evil:4200"})
    void rejectsOriginBeforeWriting(String origin) throws Exception {
        mvc.perform(put(API).header("Origin", origin).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden()).andExpect(content().string("Invalid CORS request"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Headers"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
        mvc.perform(preflight(API, origin, "PUT", "Content-Type"))
            .andExpect(status().isForbidden()).andExpect(content().string("Invalid CORS request"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Methods"));
        assertThat(controller.writes.get()).isZero();
    }

    @Test
    void rejectsUnneededMethodAndHeader() throws Exception {
        for (var request : new MockHttpServletRequestBuilder[] {
                preflight(API, ORIGIN, "DELETE", "Content-Type"),
                preflight(API, ORIGIN, "PUT", "X-Untrusted")}) {
            mvc.perform(request).andExpect(status().isForbidden())
                .andExpect(content().string("Invalid CORS request"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Headers"));
        }
        assertThat(controller.writes.get()).isZero();
    }

    @Test
    void preservesGetHeadPutAndEmptyPostWithAllowedOrigin() throws Exception {
        mvc.perform(get(API).header("Origin", ORIGIN)).andExpect(status().isOk())
            .andExpect(content().string("original"))
            .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN))
            .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
        mvc.perform(head(API).header("Origin", ORIGIN)).andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN));
        mvc.perform(put(API).header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isOk()).andExpect(content().string("{}"))
            .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN));
        mvc.perform(post("/api/catalog/sync").header("Origin", ORIGIN))
            .andExpect(status().isOk()).andExpect(content().string("synced"))
            .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN));
        assertThat(controller.writes.get()).isEqualTo(2);
    }

    @Test
    void requestsWithoutOriginKeepTheirExistingBehavior() throws Exception {
        mvc.perform(get(API)).andExpect(status().isOk()).andExpect(content().string("original"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        mvc.perform(put(API).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isOk()).andExpect(content().string("{}"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        mvc.perform(post("/api/catalog/sync")).andExpect(status().isOk())
            .andExpect(content().string("synced"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        assertThat(controller.writes.get()).isEqualTo(2);
    }

    @Test
    void mappedBadRequestKeepsCorsAndUnmappedMethodKeepsHttpError() throws Exception {
        mvc.perform(put(API).header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON).content("{"))
            .andExpect(status().isBadRequest()).andExpect(content().contentTypeCompatibleWith("application/problem+json"))
            .andExpect(jsonPath("$.title").value("Solicitud incorrecta"))
            .andExpect(jsonPath("$.detail").value("El contenido de la configuración de validación no es válido."))
            .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN));
        mvc.perform(post(API).header("Origin", ORIGIN)).andExpect(status().isMethodNotAllowed())
            .andExpect(header().exists("Allow"))
            .andExpect(jsonPath("$.title").value("Método no permitido"));
        assertThat(controller.writes.get()).isZero();
    }

    @Test
    void policyOnlyAppliesToApi() throws Exception {
        mvc.perform(get("/outside").header("Origin", ORIGIN)).andExpect(status().isOk())
            .andExpect(content().string("outside"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        mvc.perform(options("/outside").header("Origin", ORIGIN)
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void customExplicitOriginsReplaceDefaultsAndRetainExtras() throws Exception {
        start("https://museum.example, http://localhost:4300");
        for (String origin : new String[] {"https://museum.example", "http://localhost:4300"}) {
            mvc.perform(preflight(API, origin, "PUT", "Content-Type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", origin));
            mvc.perform(preflight("/api/catalog/sync", origin, "POST", "Content-Type"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", origin));
        }
        mvc.perform(put(API).header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        assertThat(controller.writes.get()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"*", "http://localhost:4200, *"})
    void wildcardConfigurationCannotAllowEveryOrigin(String origins) {
        assertThatThrownBy(() -> start(origins)).hasStackTraceContaining("CORS_ALLOWED_ORIGINS");
    }

    private static MockHttpServletRequestBuilder preflight(String path, String origin, String method, String headers) {
        return options(path).header("Origin", origin).header("Access-Control-Request-Method", method)
            .header("Access-Control-Request-Headers", headers);
    }

    @TestConfiguration(proxyBeanMethods = false)
    @EnableWebMvc
    @ComponentScan(basePackages = "co.edu.unicauca.backend.shared.infrastructure.config",
        excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX, pattern = ".*ApiCorsTest.*"))
    static class Fixture {
        @Bean
        FixtureController controller() {
            return new FixtureController();
        }

        @Bean
        ApiExceptionHandler errors() {
            return new ApiExceptionHandler();
        }
    }

    @TestComponent
    @RestController
    static class FixtureController {
        final AtomicInteger writes = new AtomicInteger();

        @GetMapping(API)
        String getConfiguration() {
            return "original";
        }

        @PutMapping(value = API, consumes = "application/json")
        String putConfiguration(@RequestBody Map<String, Object> body) {
            writes.incrementAndGet();
            return "{}";
        }

        @PostMapping("/api/catalog/sync")
        String sync() {
            writes.incrementAndGet();
            return "synced";
        }

        @GetMapping("/outside")
        String outside() {
            return "outside";
        }
    }
}
