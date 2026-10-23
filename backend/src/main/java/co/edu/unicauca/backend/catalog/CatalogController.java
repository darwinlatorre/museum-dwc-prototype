package co.edu.unicauca.backend.catalog;

import co.edu.unicauca.backend.catalog.dto.res.CatalogSyncResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CatalogController {
    private final CatalogStore store;

    private final CatalogRefresh refresh;

    public CatalogController(CatalogStore store, CatalogRefresh refresh) {
        this.store = store;
        this.refresh = refresh;
    }

    @GetMapping(value = "/api/catalog", produces = "application/json")
    public String catalog() { return store.payload(); }

    @GetMapping("/api/catalog/status")
    public CatalogStore.Status status() { return store.status(); }

    @PostMapping("/api/catalog/sync")
    public CatalogSyncResponse synchronize(HttpServletRequest request) throws IOException {
        if (request.getInputStream().read() != -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La solicitud de sincronización debe tener el cuerpo vacío.");
        }
        var result = refresh.synchronize();
        return new CatalogSyncResponse(result.outcome().name(), result.status());
    }

    public record Term(String name, String uri, String definition, String category, String status) {}
}
