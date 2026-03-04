package worker

import (
	"context"
	"log/slog"
	"time"

	"feedscheduler/internal/model"
)

// SchedulerRepository is the DB contract the Scheduler needs.
// Reference -> 100 Go Mistakes & How To Avoid Them by Teiva Harsanyi; Mistake #6 talks about this exact thing
type SchedulerRepository interface {
	GetFeedsDueForRefresh(ctx context.Context, limit int) ([]model.Feed, error)
	CleanStaleLocks(ctx context.Context, cutoff time.Time) (int64, error)
}

// Scheduler queries the database for feeds and queues them for the workers.
type Scheduler struct {
	repo            SchedulerRepository
	jobs            chan<- model.Job // Send-only channel
	pollInterval    time.Duration
	staleLockCutoff time.Duration
	batchSize       int
}

func NewScheduler(repo SchedulerRepository, jobs chan<- model.Job, pollInterval time.Duration, staleLockCutooff time.Duration, batchSize int) *Scheduler {
	return &Scheduler{
		repo:            repo,
		jobs:            jobs,
		pollInterval:    pollInterval,
		staleLockCutoff: staleLockCutooff,
		batchSize:       batchSize,
	}
}

// Start runs the polling loop until the context is canceled.
func (s *Scheduler) Start(ctx context.Context) {
	slog.Info("starting scheduler loop", "poll_interval", s.pollInterval, "batch_size", s.batchSize)

	pollTicker := time.NewTicker(s.pollInterval)
	defer pollTicker.Stop()

	reaperTicker := time.NewTicker(1 * time.Minute)
	defer reaperTicker.Stop()

	s.queueFeeds(ctx)

	for {
		select {
		case <-ctx.Done():
			slog.Info("scheduler shutting down")
			return
		case <-reaperTicker.C:
			s.reapStaleLocks(ctx)
		case <-pollTicker.C:
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

// reapStaleLocks acts as a "garbage collector" for feeds that were locked by workers that crashed.
func (s *Scheduler) reapStaleLocks(ctx context.Context) {
	cutoff := time.Now().Add(-s.staleLockCutoff) // worker working with feed > 15 mins (hardcoded or user set) => it's dead

	unlockedCount, err := s.repo.CleanStaleLocks(ctx, cutoff)
	if err != nil {
		slog.Error("failed to clean stale locks", "error", err)
		return
	}

	if unlockedCount > 0 {
		slog.Warn("reaped stale feed locks", "count", unlockedCount, "cutoff_time", cutoff)
	}
}
