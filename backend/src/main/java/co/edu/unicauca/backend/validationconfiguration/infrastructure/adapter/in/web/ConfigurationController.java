package co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web;

import co.edu.unicauca.backend.validationconfiguration.application.port.in.ConfigurationOperations;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.dto.req.UpdateConfigurationRequest;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.dto.res.ConfigurationResponse;
import co.edu.unicauca.backend.validationconfiguration.infrastructure.adapter.in.web.mapper.ConfigurationHttpMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/validation-configuration")
@RequiredArgsConstructor
public class ConfigurationController {
    private final ConfigurationOperations operations;
    private final ConfigurationHttpMapper mapper;

    @GetMapping public ConfigurationResponse get() { return mapper.toResponse(operations.get()); }

    @PutMapping(consumes = "application/json")
    public ConfigurationResponse update(@Valid @RequestBody UpdateConfigurationRequest request) {
        return mapper.toResponse(operations.update(mapper.toDomain(request)));
    }
}
