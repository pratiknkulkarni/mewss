package repository

import (
	"context"
	"database/sql"
	"errors"
	"feedscheduler/internal/model"
	"fmt"
	"log/slog"
	"strings"
	"time"
)

type PostgresFeedRepository struct {
	db *sql.DB
}

// NewPostgresFeedRepository creates a new implementation of the PostgreSQL repository
func NewPostgresFeedRepository(db *sql.DB) *PostgresFeedRepository {
	return &PostgresFeedRepository{db: db}
}

func (r *PostgresFeedRepository) ReleaseFeed(ctx context.Context, feedID string, nextFetchAfter time.Time, errorCount int, etag *string, lastModified *string) error {
	query := `
		UPDATE feed
		SET fetching_at = NULL,
		    next_fetch_after = $2,
		    force_refresh = false,
		    error_count = $3,
		    etag = $4,
			last_modified_header = $5,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.ExecContext(ctx, query, feedID, nextFetchAfter, errorCount, etag, lastModified)
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
		RETURNING id, user_id, url, refresh_interval, error_count, status, next_fetch_after, force_refresh, etag, last_modified_header
	`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}

	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
			slog.Warn("failed to close result rows", "error", err)
		}
	}(rows)

	var feeds []model.Feed

	for rows.Next() {
		var f model.Feed
		if err := rows.Scan(
			&f.ID, &f.UserID, &f.URL, &f.RefreshInterval,
			&f.ErrorCount, &f.Status, &f.NextFetchAfter, &f.ForceRefresh, &f.ETag, &f.LastModifiedHeader,
		); err != nil {
			return nil, err
		}
		feeds = append(feeds, f)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetFeedsDueForRefresh: row iteration error: %w", err)
	}

	return feeds, nil
}

func (r *PostgresFeedRepository) MarkFeedAsFailed(ctx context.Context, feedID string, errorCount int, nextFetchAfter time.Time, disabled bool) error {
	query := `
		UPDATE feed
		SET fetching_at = NULL,
		    error_count = $2,
		    next_fetch_after = $3,
			status = CASE WHEN $4 THEN 'disabled' ELSE status END,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.ExecContext(ctx, query, feedID, errorCount, nextFetchAfter, disabled)
	return err
}

// CleanStaleLocks finds the feeds which have been locked for too long and forcefully releases them
// The error count is incremented here so that if they keep getting locked, this function will forcefully release them
// and back off that feed
func (r *PostgresFeedRepository) CleanStaleLocks(ctx context.Context, cutoff time.Time) (int64, error) {
	query := `
		UPDATE feed
		SET fetching_at = NULL,
		    error_count = error_count + 1,
		    updated_at = NOW()
		WHERE fetching_at < $1
	`

	result, err := r.db.ExecContext(ctx, query, cutoff)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

// SaveArticles takes a slice of articles and executes a single bulk INSERT query.
func (r *PostgresFeedRepository) SaveArticles(ctx context.Context, articles []model.Article) error {
	if len(articles) == 0 {
		return nil
	}

	columnsPerArticle := 10
	valueStrings := make([]string, 0, len(articles))
	valueArgs := make([]interface{}, 0, len(articles)*columnsPerArticle)

	paramIndex := 1
	for _, a := range articles {
		chunk := fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)",
			paramIndex, paramIndex+1, paramIndex+2, paramIndex+3, paramIndex+4,
			paramIndex+5, paramIndex+6, paramIndex+7, paramIndex+8, paramIndex+9)
		valueStrings = append(valueStrings, chunk)

		valueArgs = append(valueArgs,
			a.FeedID, a.UserID, a.GUID, a.Title, a.URL, a.Content,
			a.Author, a.PublishedAt, a.Summary, a.IdentityHash)
		paramIndex += columnsPerArticle
	}

	query := fmt.Sprintf(`
		INSERT INTO article (feed_id, user_id, guid, title, url, content, author, published_at, summary, identity_hash)
		VALUES %s
		ON CONFLICT (identity_hash) DO NOTHING
	`, strings.Join(valueStrings, ","))

	_, err := r.db.ExecContext(ctx, query, valueArgs...)
	if err != nil {
		return fmt.Errorf("bulk insert failed: %w", err)
	}

	return nil
}
