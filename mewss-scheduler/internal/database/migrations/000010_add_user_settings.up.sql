CREATE TABLE settings
(
    user_id                 text PRIMARY KEY,

    theme                   varchar(10) NOT NULL DEFAULT 'system'
        CHECK (theme IN ('dark', 'light', 'system')),

    items_per_page          integer     NOT NULL DEFAULT 25
        CHECK (items_per_page IN (10, 25, 50, 100)),

    article_retention_hours integer
        CHECK (article_retention_hours IN (720, 1440, 2160)),

    CONSTRAINT settings_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);
