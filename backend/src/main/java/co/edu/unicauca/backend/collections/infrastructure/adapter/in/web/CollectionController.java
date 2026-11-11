package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web;

import java.util.UUID;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import co.edu.unicauca.backend.collections.application.port.in.CollectionOperations;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Trash;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.CollectionRequests;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.CollectionResponses;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.mapper.CollectionHttpMapper;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {
    private final CollectionOperations operations;
    private final CollectionHttpMapper mapper;

    @GetMapping
    public CollectionResponses.PageResponse<CollectionResponses.InfoResponse> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        var result = operations.list(page, size);
        return new CollectionResponses.PageResponse<>(result.items().stream().map(mapper::info).toList(), page, size, result.totalElements());
    }
    @GetMapping("/{id}")
    public CollectionResponses.InfoResponse detail(@PathVariable UUID id) { return mapper.info(operations.detail(id)); }
    @GetMapping("/{id}/records")
    public CollectionResponses.PageResponse<CollectionResponses.RecordResponse> records(@PathVariable UUID id,
            @RequestParam(defaultValue = "ACTIVE") Trash trash, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var result = operations.records(id, trash, page, size);
        return new CollectionResponses.PageResponse<>(result.items().stream().map(mapper::record).toList(), page, size, result.totalElements());
    }
    @GetMapping("/{id}/records/{recordId}")
    public CollectionResponses.RecordResponse record(@PathVariable UUID id, @PathVariable UUID recordId) {
        return mapper.record(operations.record(id, recordId));
    }
    @PostMapping("/imports") @ResponseStatus(HttpStatus.CREATED)
    public CollectionResponses.ImportResponse importRows(@Valid @RequestBody CollectionRequests.ImportRequest request) {
        return mapper.receipt(operations.importRows(mapper.command(request)));
    }
    @PostMapping("/{id}/records") @ResponseStatus(HttpStatus.CREATED)
    public CollectionResponses.InfoResponse add(@PathVariable UUID id, @Valid @RequestBody CollectionRequests.AddRequest request) {
        return mapper.info(operations.add(id, mapper.command(request)));
    }
    @PutMapping("/{id}/records/{recordId}")
    public CollectionResponses.InfoResponse edit(@PathVariable UUID id, @PathVariable UUID recordId,
            @Valid @RequestBody CollectionRequests.EditRequest request) {
        return mapper.info(operations.edit(id, recordId, mapper.command(request)));
    }
    @PostMapping("/{id}/records/{recordId}/trash")
    public CollectionResponses.InfoResponse trash(@PathVariable UUID id, @PathVariable UUID recordId,
            @Valid @RequestBody CollectionRequests.RevisionRequest request) {
        return mapper.info(operations.trash(id, recordId, request.expectedRevision()));
    }
    @PostMapping("/{id}/records/{recordId}/restore")
    public CollectionResponses.InfoResponse restore(@PathVariable UUID id, @PathVariable UUID recordId,
            @Valid @RequestBody CollectionRequests.RestoreRequest request) {
        return mapper.info(operations.restore(id, recordId, mapper.command(request)));
    }
}
