package co.edu.unicauca.backend.catalog.application.port.in;

import co.edu.unicauca.backend.catalog.domain.CatalogStatus;

public interface CatalogOperations {
    String payload();
    CatalogStatus status();
    Attempt attempt();
    Result synchronize();

    enum Outcome { SUCCESS, FAILED, SUPERSEDED }
    record Attempt(Long generation, boolean success, boolean failureRecorded) {}
    record Result(Outcome outcome, CatalogStatus status, Attempt attempt) {}
}
