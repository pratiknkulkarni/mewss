DROP INDEX IF EXISTS idx_user_article_states_starred;

ALTER TABLE user_article_states
    DROP COLUMN IF EXISTS starred_at,
    DROP COLUMN IF EXISTS is_starred;