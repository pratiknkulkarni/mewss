package worker

import (
	"context"
	"log/slog"
	"time"

	"feedscheduler/internal/model"
	"feedscheduler/internal/repository"
)

// Scheduler queries the database for feeds and queues them for the workers.
type Scheduler struct {
	repo         repository.FeedRepository
	jobs         chan<- model.Job // Send-only channel
	pollInterval time.Duration
	batchSize    int
}

func NewScheduler(repo repository.FeedRepository, jobs chan<- model.Job, pollInterval time.Duration, batchSize int) *Scheduler {
	return &Scheduler{
		repo:         repo,
		jobs:         jobs,
		pollInterval: pollInterval,
		batchSize:    batchSize,
	}
}

// Start runs the polling loop until the context is canceled.
func (s *Scheduler) Start(ctx context.Context) {
	slog.Info("starting scheduler loop", "poll_interval", s.pollInterval, "batch_size", s.batchSize)

	ticker := time.NewTicker(s.pollInterval)
	defer ticker.Stop()

	s.queueFeeds(ctx)

	for {
		select {
		case <-ctx.Done():
			slog.Info("scheduler shutting down")
			return
		case <-ticker.C:
			s.queueFeeds(ctx)
		}
	}
}

func (s *Scheduler) queueFeeds(ctx context.Context) {
	feeds, err := s.repo.GetFeedsDueForRefresh(ctx, s.batchSize)
	if err != nil {
		slog.Error("failed to fetch due feeds from database", "error", err)
		return
	}

	if len(feeds) == 0 {
		return
	}

	slog.Debug("found feeds due for refresh", "count", len(feeds))

	for _, feed := range feeds {
		job := model.Job{Feed: feed}

		select {
		case <-ctx.Done():
			return
		case s.jobs <- job:
		}
	}
}
