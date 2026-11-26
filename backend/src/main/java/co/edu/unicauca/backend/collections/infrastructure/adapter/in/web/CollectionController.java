package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web;

import java.util.UUID;
import co.edu.unicauca.backend.collections.domain.model.RecordOrder;
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
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.AddRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.EditRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.ImportRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.RestoreRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.RevisionRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.ImportResponse;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.InfoResponse;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.PageResponse;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.RecordResponse;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.mapper.CollectionHttpMapper;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {
    private final CollectionOperations operations;
    private final CollectionHttpMapper mapper;

    @GetMapping
    public PageResponse<InfoResponse> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        var result = operations.list(page, size);
        return new PageResponse<>(result.items().stream().map(mapper::info).toList(), page, size, result.totalElements());
    }
    @GetMapping("/{id}")
    public InfoResponse detail(@PathVariable UUID id) { return mapper.info(operations.detail(id)); }
    @GetMapping("/{id}/records")
    public PageResponse<RecordResponse> records(@PathVariable UUID id,
            @RequestParam(defaultValue = "ACTIVE") Trash trash, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size, @RequestParam(required = false) String sortField,
            @RequestParam(required = false) String sortDirection) {
        var result = operations.records(id, trash, page, size, RecordOrder.parse(sortField, sortDirection));
        return new PageResponse<>(result.items().stream().map(mapper::record).toList(), page, size, result.totalElements());
    }
    @GetMapping("/{id}/records/{recordId}")
    public RecordResponse record(@PathVariable UUID id, @PathVariable UUID recordId) {
        return mapper.record(operations.record(id, recordId));
    }
    @PostMapping("/imports") @ResponseStatus(HttpStatus.CREATED)
    public ImportResponse importRows(@Valid @RequestBody ImportRequest request) {
        return mapper.receipt(operations.importRows(mapper.command(request)));
    }
    @PostMapping("/{id}/records") @ResponseStatus(HttpStatus.CREATED)
    public InfoResponse add(@PathVariable UUID id, @Valid @RequestBody AddRequest request) {
        return mapper.info(operations.add(id, mapper.command(request)));
    }
    @PutMapping("/{id}/records/{recordId}")
    public InfoResponse edit(@PathVariable UUID id, @PathVariable UUID recordId,
            @Valid @RequestBody EditRequest request) {
        return mapper.info(operations.edit(id, recordId, mapper.command(request)));
    }
    @PostMapping("/{id}/records/{recordId}/trash")
    public InfoResponse trash(@PathVariable UUID id, @PathVariable UUID recordId,
            @Valid @RequestBody RevisionRequest request) {
        return mapper.info(operations.trash(id, recordId, request.expectedRevision()));
    }
    @PostMapping("/{id}/records/{recordId}/restore")
    public InfoResponse restore(@PathVariable UUID id, @PathVariable UUID recordId,
            @Valid @RequestBody RestoreRequest request) {
        return mapper.info(operations.restore(id, recordId, mapper.command(request)));
    }
}
