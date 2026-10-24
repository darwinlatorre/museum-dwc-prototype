package co.edu.unicauca.backend.catalog.adapter.in.http;

import co.edu.unicauca.backend.catalog.adapter.in.http.dto.res.CatalogSyncResponse;
import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.domain.CatalogStatus;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CatalogController {
    private final CatalogOperations operations;

    public CatalogController(CatalogOperations operations) {
        this.operations = operations;
    }

    @GetMapping(value = "/api/catalog", produces = "application/json")
    public String catalog() { return operations.payload(); }

    @GetMapping("/api/catalog/status")
    public CatalogStatus status() { return operations.status(); }

    @PostMapping("/api/catalog/sync")
    public CatalogSyncResponse synchronize(HttpServletRequest request) throws IOException {
        if (request.getInputStream().read() != -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La solicitud de sincronización debe tener el cuerpo vacío.");
        }
        var result = operations.synchronize();
        return new CatalogSyncResponse(result.outcome().name(), result.status());
    }
}
