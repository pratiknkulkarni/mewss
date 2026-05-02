ALTER TABLE user_article_states
    ADD COLUMN is_starred  boolean     NOT NULL DEFAULT false, 
    ADD COLUMN starred_at  timestamptz;

CREATE INDEX idx_user_article_states_starred
    ON user_article_states (user_id, is_starred)
    WHERE is_starred = true;