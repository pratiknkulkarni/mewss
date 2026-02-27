package worker

import (
	"context"
	"feedscheduler/internal/model"
	"feedscheduler/internal/service"
	"log/slog"
	"sync"
	"time"
)

// Pool manages a group of concurrent workers processing feeds.
type Pool struct {
	workerCount int
	service     *service.FeedService
	jobs        <-chan model.Job
	wg          *sync.WaitGroup
}

func NewPool(workerCount int, service *service.FeedService, jobs <-chan model.Job) *Pool {
	return &Pool{
		workerCount: workerCount,
		service:     service,
		jobs:        jobs,
		wg:          &sync.WaitGroup{},
	}
}

// Start spins up the goroutines and blocks until the context is canceled.
func (p *Pool) Start(ctx context.Context) {
	slog.Info("starting worker pool", "worker_count", p.workerCount)

	for i := 1; i <= p.workerCount; i++ {
		p.wg.Add(1)
		go p.worker(ctx, i)
	}
}

// Stop waits for all workers to finish their current jobs.
func (p *Pool) Stop() {
	slog.Info("waiting for workers to drain gracefully...")
	p.wg.Wait()
	slog.Info("all workers stopped")
}

func (p *Pool) worker(ctx context.Context, id int) {
	defer p.wg.Done()

	logger := slog.With("worker_id", id)
	logger.Debug("worker started")

	for {
		select {
		case <-ctx.Done():
			logger.Debug("worker shutting down")
			return
		case job, ok := <-p.jobs:
			if !ok {
				return
			}

			logger.Debug("worker picked up job", "feed_id", job.Feed.ID)

			// process feed with a 15 minutes stale lock timer
			p.service.ProcessFeed(ctx, job.Feed, 15*time.Minute)
		}
	}
}
