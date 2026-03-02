package repository

import (
	"context"
	"feedscheduler/internal/model"
	"time"
)

// FeedRepository defines all database operations required by the scheduler.
type FeedRepository interface {
	GetFeedsDueForRefresh(ctx context.Context, limit int) ([]model.Feed, error)
	GetRemainingFeedsCount(ctx context.Context) (int, error)

	ClaimFeed(ctx context.Context, feedID string, staleThreshold time.Duration) (bool, error)
	SaveArticle(ctx context.Context, article *model.Article) error
	SaveArticles(ctx context.Context, articles []model.Article) error
	//ReleaseFeed(ctx context.Context, feedID string, nextFetchAfter time.Time, errorCount int) error

	ReleaseFeed(ctx context.Context, feedID string, nextFetchAfter time.Time, errorCount int, etag *string, lastModified *string) error

	MarkFeedAsFailed(ctx context.Context, feedID string, errorCount int, nextFetchAfter time.Time) error
	CleanStaleLocks(ctx context.Context, cutoff time.Time) (int64, error)
}
