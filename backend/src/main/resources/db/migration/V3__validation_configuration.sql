CREATE TABLE validation_configuration (
    id smallint PRIMARY KEY CHECK (id = 1),
    revision bigint NOT NULL CHECK (revision >= 0),
    contexts jsonb NOT NULL CHECK (jsonb_typeof(contexts) = 'array')
);
