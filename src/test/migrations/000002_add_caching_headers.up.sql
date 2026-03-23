ALTER TABLE feed
    ADD COLUMN etag                 TEXT,
    ADD COLUMN last_modified_header TEXT;