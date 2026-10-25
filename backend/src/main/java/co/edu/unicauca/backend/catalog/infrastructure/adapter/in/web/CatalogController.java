package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web;

import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogStatusResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogSyncResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.service.CatalogWebService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CatalogController {
    private final CatalogWebService service;

    @GetMapping(value = "/api/catalog", produces = "application/json")
    public String catalog() { return service.catalog(); }

    @GetMapping("/api/catalog/status")
    public CatalogStatusResponse status() { return service.status(); }

    @PostMapping("/api/catalog/sync")
    public CatalogSyncResponse synchronize(HttpServletRequest request) throws IOException {
        return service.synchronize(request);
    }
}
