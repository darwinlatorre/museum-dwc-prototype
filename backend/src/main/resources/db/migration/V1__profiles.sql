CREATE TABLE profiles (
    id varchar(100) PRIMARY KEY,
    name varchar(200) NOT NULL CHECK (length(trim(name)) > 0 AND name = trim(name)),
    version varchar(100) NOT NULL CHECK (length(trim(version)) > 0 AND version = trim(version)),
    status varchar(20) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
    revision bigint NOT NULL CHECK (revision >= 0),
    description text NOT NULL,
    rules jsonb NOT NULL CHECK (jsonb_typeof(rules) = 'array'),
    UNIQUE (name, version)
);

-- The complete version (including its JSON rules) is a single atomic immutable row.
CREATE FUNCTION preserve_published_profile() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status = 'PUBLISHED' THEN
        RAISE EXCEPTION 'Published profiles are immutable' USING ERRCODE = '23514';
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TRIGGER immutable_published_profile BEFORE UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION preserve_published_profile();
