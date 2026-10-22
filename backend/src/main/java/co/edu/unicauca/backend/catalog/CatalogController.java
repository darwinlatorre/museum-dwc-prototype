package co.edu.unicauca.backend.catalog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CatalogController {
    private final CatalogStore store;

    public CatalogController(CatalogStore store) { this.store = store; }

    @GetMapping(value = "/api/catalog", produces = "application/json")
    public String catalog() { return store.payload(); }

    @GetMapping("/api/catalog/status")
    public CatalogStore.Status status() { return store.status(); }

    public record Term(String name, String uri, String definition, String category, String status) {}
}
