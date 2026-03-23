CREATE TABLE IF NOT EXISTS feed
(
    id
                     VARCHAR(255) PRIMARY KEY,
    user_id          VARCHAR(255) NOT NULL,
    url              TEXT         NOT NULL,
    refresh_interval BIGINT       NOT NULL, -- Stored as nanoseconds (Go time.Duration)
    error_count      INT                      DEFAULT 0,
    status           VARCHAR(50)              DEFAULT 'active',
    next_fetch_after TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    force_refresh    BOOLEAN                  DEFAULT false,
    fetching_at      TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP
                         WITH TIME ZONE       DEFAULT NOW(),
    updated_at       TIMESTAMP
                         WITH TIME ZONE       DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article
(
    id
                  UUID
        PRIMARY
            KEY
                                     DEFAULT
                                         gen_random_uuid
                                         (
                                         ),
    feed_id       VARCHAR(255)       NOT NULL REFERENCES feed
        (
         id
            ) ON DELETE CASCADE,
    user_id       VARCHAR(255)       NOT NULL,
    guid          TEXT,
    title         TEXT               NOT NULL,
    url           TEXT               NOT NULL,
    author        TEXT,
    published_at  TIMESTAMP
                      WITH TIME ZONE,
    summary       TEXT,
    identity_hash VARCHAR(64) UNIQUE NOT NULL,
    created_at    TIMESTAMP
                      WITH TIME ZONE DEFAULT NOW()
);

-- Index for the scheduler to quickly find feeds due for refresh
CREATE INDEX idx_feed_next_fetch ON feed (next_fetch_after, status, fetching_at);