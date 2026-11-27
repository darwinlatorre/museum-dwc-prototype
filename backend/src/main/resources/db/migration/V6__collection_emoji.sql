-- Aditiva: identificador visual opcional de la colección. No modifica datos ni migraciones anteriores.
ALTER TABLE biological_collection
    ADD COLUMN emoji varchar(16) CHECK (emoji IS NULL OR length(emoji) BETWEEN 1 AND 16);
