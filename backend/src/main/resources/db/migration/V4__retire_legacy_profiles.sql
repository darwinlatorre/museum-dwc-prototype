-- Retiro explícito autorizado del producto legado; sin CASCADE ni otros datos.
DROP TRIGGER immutable_published_profile ON profiles;
DROP TABLE profiles;
DROP FUNCTION preserve_published_profile();
