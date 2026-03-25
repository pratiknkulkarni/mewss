-- Prevents a user from subscribing to the same RSS URL twice.
-- The API service layer (Hono) catches the resulting 23505 Postgres error
-- and converts it to a 409 Conflict response.

CREATE UNIQUE INDEX feed_user_id_url_key ON feed (user_id, url);