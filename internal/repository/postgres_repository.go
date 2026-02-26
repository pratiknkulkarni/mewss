package repository

import (
	"context"
	"database/sql"
	"errors"
	"feedscheduler/internal/model"
	"fmt"
)

type PostgresFeedRepository struct {
	db *sql.DB
}

// NewPostgresFeedRepository creates a new implementation of the PostgreSQL repository
func NewPostgresFeedRepository(db *sql.DB) *PostgresFeedRepository {
	return &PostgresFeedRepository{db: db}
}
func (r *PostgresFeedRepository) ClaimFeed(ctx context.Context, feedID string) (bool, error) {
	//TODO: maybe add a threashold here? So if a lock is locked for longer than x mins, it ignores the lock
	query := `
		UPDATE feed
		SET fetching_at = NOW()
		WHERE id = $1
		  AND (fetching_at IS NULL)
-- 			 AND FETCHING < threshhold
		RETURNING id
	`
	var id string
	err := r.db.QueryRowContext(ctx, query, feedID).Scan(&id)

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
	SELECT id, user_id, url, refresh_interval, error_count, status, next_fetch_after, force_refresh
		FROM feed
		WHERE (status = 'active' OR force_refresh = true)
		  AND (next_fetch_after <= NOW() OR force_refresh = true)
		  AND fetching_at IS NULL
		ORDER BY next_fetch_after ASC
		LIMIT $1
		`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

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
	result, err := r.db.ExecContext(ctx, query,
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

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		fmt.Println("rowsAffected -> ", rowsAffected)
	}

	lastInsertId, err := result.LastInsertId()
	if err != nil {
		fmt.Println(lastInsertId)
	}

	return err
}
