package co.edu.unicauca.backend.profile.domain;

import java.util.List;

public record Profile(String id, String name, String version, Status status, long revision,
                      String description, List<Rule> rules) {
    public enum Status { DRAFT, PUBLISHED }
    public enum Kind { required, requiredColumn, date, latitude, longitude }
    public enum Severity { ERROR, WARNING }
    public enum Condition { always, collection, permit, marine, permitAndCollection, sampling }

    public record Rule(String field, Kind kind, Severity severity, Condition condition,
                       String message, String source) {}

    public record Content(String name, String version, String description, List<Rule> rules) {}
}
