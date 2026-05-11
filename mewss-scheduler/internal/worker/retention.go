package worker

import (
	"context"
	"log/slog"
	"time"
)

// RetentionRepository is the DB contract the RetentionCleaner needs.
type RetentionRepository interface {
	DeleteExpiredArticles(ctx context.Context) (int64, error)
}

// RetentionCleaner runs a daily article-pruning job at a fixed wall-clock hour.
type RetentionCleaner struct {
	repo         RetentionRepository
	runAtHour    int
	queryTimeout time.Duration
}

func NewRetentionCleaner(repo RetentionRepository) *RetentionCleaner {
	return &RetentionCleaner{
		repo:         repo,
		runAtHour:    3,               // 03:00 AM system time; maybe this shouldn't be configurable
		queryTimeout: 5 * time.Minute, // try running queries for this long or stop
	}
}

func (rc *RetentionCleaner) Start(ctx context.Context) {
    // align the schedule first
	initialDelay := rc.durationUntilNextRun()
	slog.Info("retention cleaner scheduled", "next_run_in", initialDelay.Round(time.Second))

	select {
	case <-ctx.Done():
		return
	case <-time.After(initialDelay):
	}

	rc.delete(ctx)

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("retention cleaner shutting down")
			return
		case <-ticker.C:
			rc.delete(ctx)
		}
	}
}

func (rc *RetentionCleaner) delete(ctx context.Context) {
	deleteCtx, cancel := context.WithTimeout(ctx, rc.queryTimeout)
	defer cancel()

	deleted, err := rc.repo.DeleteExpiredArticles(deleteCtx)
	if err != nil {
		slog.Error("article retention pruning failed", "error", err)
		return
	}

	slog.Info("article retention pruning complete", "deleted_articles", deleted)
}

// durationUntilNextRun returns the time remaining until the next runAtHour boundary.
// If we are past today's boundary, it targets tomorrow's.
func (rc *RetentionCleaner) durationUntilNextRun() time.Duration {
	now := time.Now()
	next := time.Date(now.Year(), now.Month(), now.Day(), rc.runAtHour, 0, 0, 0, now.Location())
	if !now.Before(next) {
		next = next.Add(24 * time.Hour)
	}
	return time.Until(next)
}
