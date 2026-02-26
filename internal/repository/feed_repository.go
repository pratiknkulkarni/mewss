package repository

import (
	"context"
	"feedscheduler/internal/model"
	"time"
)

// FeedRepository defines all database operations required by the scheduler.
type FeedRepository interface {
	// Scheduler operations
	GetFeedsDueForRefresh(ctx context.Context, limit int) ([]model.Feed, error)
	GetRemainingFeedsCount(ctx context.Context) (int, error)

	ClaimFeed(ctx context.Context, feedID string, staleThreshold time.Duration) (bool, error)
	SaveArticle(ctx context.Context, article *model.Article) error
}
