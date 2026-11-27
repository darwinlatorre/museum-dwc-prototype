CREATE TABLE biological_collection (
    id uuid PRIMARY KEY,
    name varchar(200) NOT NULL CHECK (length(name) > 0),
    context varchar(20) NOT NULL CHECK (context IN ('collection', 'permit', 'sampling', 'marine', 'other')),
    revision bigint NOT NULL CHECK (revision >= 0)
);

CREATE TABLE collection_import (
    idempotency_key uuid PRIMARY KEY,
    identity varchar(64) NOT NULL,
    collection_id uuid NOT NULL REFERENCES biological_collection(id),
    revision bigint NOT NULL CHECK (revision > 0),
    inserted integer NOT NULL CHECK (inserted BETWEEN 1 AND 50000)
);

CREATE TABLE collection_record (
    id uuid PRIMARY KEY,
    collection_id uuid NOT NULL REFERENCES biological_collection(id),
    headers jsonb NOT NULL CHECK (jsonb_typeof(headers) = 'array' AND jsonb_array_length(headers) BETWEEN 1 AND 500),
    mapping jsonb NOT NULL CHECK (jsonb_typeof(mapping) = 'object'),
    source_row integer NOT NULL CHECK (source_row > 0),
    original_values jsonb NOT NULL CHECK (jsonb_typeof(original_values) = 'array'),
    row_values jsonb NOT NULL CHECK (jsonb_typeof(row_values) = 'array'),
    import_key uuid REFERENCES collection_import(idempotency_key) DEFERRABLE INITIALLY DEFERRED,
    configuration_revision bigint NOT NULL CHECK (configuration_revision >= 0),
    catalog_version bigint NOT NULL CHECK (catalog_version >= 0),
    trashed boolean NOT NULL DEFAULT false,
    row_hash varchar(64) NOT NULL,
    occurrence_hash varchar(64),
    CHECK (jsonb_array_length(headers) = jsonb_array_length(original_values)
        AND jsonb_array_length(headers) = jsonb_array_length(row_values))
);
CREATE INDEX collection_record_page ON collection_record(collection_id, trashed, id);
CREATE UNIQUE INDEX collection_record_equal_active ON collection_record(collection_id, row_hash) WHERE NOT trashed;
CREATE UNIQUE INDEX collection_record_occurrence_active ON collection_record(collection_id, occurrence_hash)
    WHERE NOT trashed AND occurrence_hash IS NOT NULL;

CREATE FUNCTION preserve_collection_record_origin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.collection_id IS DISTINCT FROM OLD.collection_id
        OR NEW.headers IS DISTINCT FROM OLD.headers OR NEW.mapping IS DISTINCT FROM OLD.mapping
        OR NEW.source_row IS DISTINCT FROM OLD.source_row OR NEW.original_values IS DISTINCT FROM OLD.original_values
        OR NEW.import_key IS DISTINCT FROM OLD.import_key THEN
        RAISE EXCEPTION 'El origen del registro es inmutable.';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_collection_record_origin BEFORE UPDATE ON collection_record
    FOR EACH ROW EXECUTE FUNCTION preserve_collection_record_origin();
