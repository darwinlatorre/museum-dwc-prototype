CREATE TABLE catalog_snapshot (
    id integer PRIMARY KEY CHECK (id = 1),
    generation bigint NOT NULL DEFAULT 0,
    snapshot_version bigint NOT NULL DEFAULT 0,
    payload text,
    source_hash varchar(64),
    source_revision varchar(100),
    raw_sources text,
    seed_provenance text,
    activated_at timestamptz,
    last_attempt timestamptz,
    last_failure text,
    term_count integer NOT NULL DEFAULT 0,
    added integer NOT NULL DEFAULT 0,
    modified integer NOT NULL DEFAULT 0,
    deprecated integer NOT NULL DEFAULT 0
);
INSERT INTO catalog_snapshot(id) VALUES (1);
