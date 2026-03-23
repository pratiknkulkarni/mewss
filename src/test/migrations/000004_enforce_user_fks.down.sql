ALTER TABLE "article"
    DROP CONSTRAINT IF EXISTS "article_user_id_fkey";
ALTER TABLE "feed"
    DROP CONSTRAINT IF EXISTS "feed_user_id_fkey";