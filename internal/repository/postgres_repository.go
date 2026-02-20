package repository

import (
	"context"
	"database/sql"
	"feedscheduler/internal/model"
)

type PostgresFeedRepository struct {
	db *sql.DB
}

// NewPostgresFeedRepository creates a new implementation of the PostgreSQL repository
func NewPostgresFeedRepository(db *sql.DB) *PostgresFeedRepository {
	return &PostgresFeedRepository{db: db}
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
