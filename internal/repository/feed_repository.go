package repository

import (
	"context"
	"feedscheduler/internal/model"
)

// FeedRepository defines all database operations required by the scheduler.
type FeedRepository interface {
	// Scheduler operations
	GetFeedsDueForRefresh(ctx context.Context, limit int) ([]model.Feed, error)
}
