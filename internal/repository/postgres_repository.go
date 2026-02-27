package repository

import (
	"context"
	"database/sql"
	"errors"
	"feedscheduler/internal/model"
	"time"
)

type PostgresFeedRepository struct {
	db *sql.DB
}

// NewPostgresFeedRepository creates a new implementation of the PostgreSQL repository
func NewPostgresFeedRepository(db *sql.DB) *PostgresFeedRepository {
	return &PostgresFeedRepository{db: db}
}

func (r *PostgresFeedRepository) ReleaseFeed(ctx context.Context, feedID string, nextFetchAfter time.Time, errorCount int) error {
	query := `
		UPDATE feed
		SET fetching_at = NULL,
		    next_fetch_after = $2,
		    force_refresh = false,
		    error_count = $3,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.ExecContext(ctx, query, feedID, nextFetchAfter, errorCount)
	return err
}

func (r *PostgresFeedRepository) ClaimFeed(ctx context.Context, feedID string, staleThreshold time.Duration) (bool, error) {
	threshold := time.Now().Add(-staleThreshold)

	query := `
		UPDATE feed
		SET fetching_at = NOW()
		WHERE id = $1
		AND (fetching_at IS NULL OR fetching_at < $2)
		RETURNING id
	`
	var id string
	err := r.db.QueryRowContext(ctx, query, feedID, threshold).Scan(&id)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// some other worker grabbed it OR it does not exist
			return false, nil
		}
		return false, err
	}

	return true, nil
}

func (r *PostgresFeedRepository) GetRemainingFeedsCount(ctx context.Context) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM feed
		WHERE (next_fetch_after <= NOW() OR force_refresh = true)
		  AND (status = 'active' OR force_refresh = true)
		  AND fetching_at IS NULL
	`

	var count int
	err := r.db.QueryRowContext(ctx, query).Scan(&count)
	return count, err
}

func (r *PostgresFeedRepository) GetFeedsDueForRefresh(ctx context.Context, limit int) ([]model.Feed, error) {
	query := `
		UPDATE feed
		SET fetching_at = NOW()
		WHERE id IN (
			SELECT id
			FROM feed
			WHERE (next_fetch_after <= NOW() OR force_refresh = true)
			  AND (status = 'active' OR force_refresh = true)
			  AND fetching_at IS NULL
			LIMIT $1
			FOR UPDATE SKIP LOCKED
		)
		RETURNING id, user_id, url, refresh_interval, error_count, status, next_fetch_after, force_refresh
	`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}

	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
		}
	}(rows)

	var feeds []model.Feed

	for rows.Next() {
		var f model.Feed
		if err := rows.Scan(
			&f.ID, &f.UserID, &f.URL, &f.RefreshInterval,
			&f.ErrorCount, &f.Status, &f.NextFetchAfter, &f.ForceRefresh,
		); err != nil {
			return nil, err
		}
		feeds = append(feeds, f)
	}

	return feeds, nil
}

func (r *PostgresFeedRepository) SaveArticle(ctx context.Context, article *model.Article) error {
	query := `
		INSERT INTO article (
			feed_id, user_id, guid, title, url, author, published_at, summary, identity_hash
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9
		)
		ON CONFLICT (identity_hash) DO NOTHING
	`
	_, err := r.db.ExecContext(ctx, query,
		article.FeedID,
		article.UserID,
		article.GUID,
		article.Title,
		article.URL,
		article.Author,
		article.PublishedAt,
		article.Summary,
		article.IdentityHash,
	)

	if err != nil {
		return err
	}

	return err
}

func (r *PostgresFeedRepository) MarkFeedAsFailed(ctx context.Context, feedID string, errorCount int, nextFetchAfter time.Time) error {
	//TODO: check -> if the error count is very high (say, > 5?) maybe I just mark this one as failed
	query := `
		UPDATE feed
		SET fetching_at = NULL,
		    error_count = $2,
		    next_fetch_after = $3,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.ExecContext(ctx, query, feedID, errorCount, nextFetchAfter)
	return err
}
