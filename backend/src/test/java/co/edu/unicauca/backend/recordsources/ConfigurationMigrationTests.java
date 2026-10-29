package co.edu.unicauca.backend.recordsources;

import co.edu.unicauca.backend.BackendApplication;
import co.edu.unicauca.backend.recordsources.application.port.in.ConfigurationOperations;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.util.function.Function;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.logging.LoggingApplicationListener;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ConfigurationMigrationTests {
    // No component scan: migrate the genuine V1/V2 schema before loading the new product.
    @TestConfiguration(proxyBeanMethods = false)
    @EnableAutoConfiguration
    static class MigrationApplication {}

    @Test void upgradeRetiresOnlyProfilesPreservingCatalogHistoryAndEditedConfiguration() throws Exception {
        try (var postgres = new PostgreSQLContainer("postgres:17-alpine")) {
            postgres.start();
            String catalog;
            String history;
            try (var old = new SpringApplicationBuilder(MigrationApplication.class).web(WebApplicationType.NONE).run(
                    arguments(postgres, "--spring.flyway.target=2", "--spring.jpa.hibernate.ddl-auto=none"))) {
                transaction(old, em -> {
                    em.createNativeQuery("insert into profiles(id,name,version,status,revision,description,rules) values ('old','Publicado','1','PUBLISHED',7,'Texto Ω','[]'::jsonb)").executeUpdate();
                    em.createNativeQuery("update catalog_snapshot set generation=13, payload='[]', source_revision='unchanged', seed_provenance='evidencia original'").executeUpdate();
                    return null;
                });
                history = text(old, "select jsonb_agg(to_jsonb(h) order by installed_rank)::text from flyway_schema_history h where version in ('1','2')");
                catalog = text(old, "select to_jsonb(c)::text from catalog_snapshot c");
                // Apply V3 separately to prove V4 does not touch pre-existing global edits.
                var configuration = old.getBean(Flyway.class).getConfiguration();
                Flyway.configure().configuration(configuration).target("3").load().migrate();
                transaction(old, em -> {
                    em.createNativeQuery("insert into validation_configuration(id,revision,contexts) values (1,9,'[{\"context\":\"collection\",\"requiredFields\":[\" campo Ω \"]},{\"context\":\"permit\",\"requiredFields\":[]},{\"context\":\"sampling\",\"requiredFields\":[]},{\"context\":\"marine\",\"requiredFields\":[]},{\"context\":\"other\",\"requiredFields\":[]}]'::jsonb)").executeUpdate();
                    return null;
                });
                String global = text(old, "select to_jsonb(c)::text from validation_configuration c");
                Flyway.configure().configuration(configuration).target("latest").load().migrate();
                assertRetired(old);
                assertThat(text(old, "select to_jsonb(c)::text from catalog_snapshot c")).isEqualTo(catalog);
                assertThat(text(old, "select to_jsonb(c)::text from validation_configuration c")).isEqualTo(global);
                assertThat(text(old, "select jsonb_agg(to_jsonb(h) order by installed_rank)::text from flyway_schema_history h where version in ('1','2')")).isEqualTo(history);
            }
            String publicConfiguration;
            try (var current = new SpringApplicationBuilder(BackendApplication.class).run(arguments(postgres))) {
                assertRetired(current);
                var mvc = MockMvcBuilders.webAppContextSetup((WebApplicationContext) current).build();
                String before = mvc.perform(get("/api/validation-configuration")).andExpect(status().isOk())
                    .andExpect(jsonPath("$.revision").value(9))
                    .andExpect(jsonPath("$.contexts[0].requiredFields[0]").value(" campo Ω "))
                    .andReturn().getResponse().getContentAsString();
                mvc.perform(put("/api/validation-configuration").contentType("application/json").content(before))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(10));
                publicConfiguration = mvc.perform(get("/api/validation-configuration")).andReturn().getResponse().getContentAsString();
                assertThat(text(current, "select to_jsonb(c)::text from catalog_snapshot c")).isEqualTo(catalog);
            }
            try (var restarted = new SpringApplicationBuilder(BackendApplication.class).run(arguments(postgres))) {
                var mvc = MockMvcBuilders.webAppContextSetup((WebApplicationContext) restarted).build();
                assertThat(mvc.perform(get("/api/validation-configuration")).andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString()).isEqualTo(publicConfiguration);
                assertThat(text(restarted, "select jsonb_agg(to_jsonb(h) order by installed_rank)::text from flyway_schema_history h where version in ('1','2')")).isEqualTo(history);
            }
        }
    }

    @Test void simultaneousFreshInstallRunsFourMigrationsAndBootstrapsExactlyOneConfiguration() throws Exception {
        try (var postgres = new PostgreSQLContainer("postgres:17-alpine")) {
            postgres.start();
            var ready = new CountDownLatch(2);
            Callable<ConfigurableApplicationContext> start = () -> {
                ready.countDown();
                assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
                // Two contexts share JVM-global Tomcat home properties; HTTP is covered separately.
                // Keep the genuine Flyway/JPA/bootstrap race without racing embedded web containers.
                var application = new SpringApplicationBuilder(BackendApplication.class)
                    .web(WebApplicationType.NONE).application();
                // Logging is JVM-global; two real bootstraps must not reconfigure Logback concurrently.
                application.setListeners(application.getListeners().stream()
                    .filter(listener -> !(listener instanceof LoggingApplicationListener)).toList());
                return application.run(arguments(postgres));
            };
            try (var executor = Executors.newFixedThreadPool(2)) {
                var apps = executor.invokeAll(List.of(start, start));
                try {
                    for (var future : apps) {
                        var app = future.get();
                        assertRetired(app);
                        var configuration = app.getBean(ConfigurationOperations.class).get();
                        assertThat(configuration.revision()).isZero();
                        assertThat(configuration.contexts()).hasSize(5);
                        assertThat(text(app, "select count(*)::text from validation_configuration")).isEqualTo("1");
                        assertThat(text(app, "select count(*)::text from flyway_schema_history where success")).isEqualTo("4");
                    }
                } finally {
                    for (var future : apps) if (future.state() == Future.State.SUCCESS) future.get().close();
                }
            }
        }
    }

    static String[] arguments(PostgreSQLContainer postgres, String... extra) {
        var args = new ArrayList<>(List.of(
            "--spring.datasource.url=" + postgres.getJdbcUrl(),
            "--spring.datasource.username=" + postgres.getUsername(),
            "--spring.datasource.password=" + postgres.getPassword(),
            "--spring.config.import=", "--catalog.sync.enabled=false", "--server.port=0"));
        args.addAll(List.of(extra));
        return args.toArray(String[]::new);
    }
    static <T> T transaction(ConfigurableApplicationContext app, Function<EntityManager, T> action) {
        try (var em = app.getBean(EntityManagerFactory.class).createEntityManager()) {
            var transaction = em.getTransaction();
            transaction.begin();
            try {
                T result = action.apply(em);
                transaction.commit();
                return result;
            } catch (RuntimeException exception) {
                transaction.rollback();
                throw exception;
            }
        }
    }
    static String text(ConfigurableApplicationContext app, String sql) {
        return transaction(app, em -> (String) em.createNativeQuery(sql, String.class).getSingleResult());
    }
    static void assertRetired(ConfigurableApplicationContext app) {
        assertThat(text(app, "select count(*)::text from pg_tables where schemaname='public' and tablename='profiles'")).isEqualTo("0");
        assertThat(text(app, "select count(*)::text from pg_trigger where tgname='immutable_published_profile'")).isEqualTo("0");
        assertThat(text(app, "select count(*)::text from pg_proc where proname='preserve_published_profile'")).isEqualTo("0");
    }
}
