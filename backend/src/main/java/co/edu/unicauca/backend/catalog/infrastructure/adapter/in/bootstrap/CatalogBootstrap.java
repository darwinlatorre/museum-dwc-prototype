package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.bootstrap;

import co.edu.unicauca.backend.catalog.application.port.out.CatalogStore;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import java.io.IOException;
import lombok.RequiredArgsConstructor;

/** La inicialización idempotente conserva los bytes del bundle y de la instantánea persistida. */
@RequiredArgsConstructor
public final class CatalogBootstrap implements ApplicationRunner {
    private final CatalogStore store;

    @Override public void run(ApplicationArguments arguments) throws IOException { store.initialize(); }
}
