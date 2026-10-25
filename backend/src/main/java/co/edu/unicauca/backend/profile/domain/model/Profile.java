package co.edu.unicauca.backend.profile.domain.model;

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

    /** Construcción con nombres; la validación y normalización pertenecen al caso de uso. */
    public static Builder builder() {
        return new Builder();
    }

    public Builder toBuilder() {
        return builder().id(id).name(name).version(version).status(status).revision(revision)
            .description(description).rules(rules);
    }

    public static final class Builder {
        private String id;
        private String name;
        private String version;
        private Status status;
        private long revision;
        private String description;
        private List<Rule> rules;

        private Builder() {}

        public Builder id(String value) { id = value; return this; }
        public Builder name(String value) { name = value; return this; }
        public Builder version(String value) { version = value; return this; }
        public Builder status(Status value) { status = value; return this; }
        public Builder revision(long value) { revision = value; return this; }
        public Builder description(String value) { description = value; return this; }
        public Builder rules(List<Rule> value) { rules = value; return this; }

        public Profile build() {
            return new Profile(id, name, version, status, revision, description, rules);
        }
    }
}
