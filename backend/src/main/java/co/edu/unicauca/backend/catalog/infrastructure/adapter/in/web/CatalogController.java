package co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogStatusResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.dto.res.CatalogSyncResponse;
import co.edu.unicauca.backend.catalog.infrastructure.adapter.in.web.mapper.CatalogHttpMapper;
import java.io.IOException;
import java.io.InputStream;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {
    private final CatalogOperations operations;
    private final CatalogHttpMapper mapper;

    /** Persisted payload bytes are served verbatim, never re-serialized. */
    @GetMapping(produces = "application/json")
    public String catalog() { return operations.payload(); }

    @GetMapping("/status")
    public CatalogStatusResponse status() { return mapper.toResponse(operations.status()); }

    @PostMapping("/sync")
    public CatalogSyncResponse synchronize(InputStream body) throws IOException {
        // Any byte, including whitespace or a JSON null, breaks the empty-body contract.
        if (body.read() != -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La solicitud de sincronización debe tener el cuerpo vacío.");
        }
        return mapper.toResponse(operations.synchronize());
    }
}
