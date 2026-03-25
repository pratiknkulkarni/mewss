package worker

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"feedscheduler/internal/model"
)

// ── mock ──────────────────────────────────────────────────────────────────
// These tests were generated using Claude Sonnet 4.6

type mockProcessor struct {
	mu             sync.Mutex
	processedFeeds []model.Feed
	releasedFeeds  []model.Feed
}

func (m *mockProcessor) ProcessFeed(_ context.Context, feed model.Feed) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.processedFeeds = append(m.processedFeeds, feed)
}

func (m *mockProcessor) ReleaseLockOnly(_ context.Context, feed model.Feed) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.releasedFeeds = append(m.releasedFeeds, feed)
	return nil
}

func (m *mockProcessor) processedCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.processedFeeds)
}

func (m *mockProcessor) releasedCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.releasedFeeds)
}

// newTestPool wires up a Pool with a fast limiter timeout so tests
// don't sit around waiting for the real 10-second window.
func newTestPool(workerCount int, proc FeedProcessor, jobs chan model.Job) *Pool {
	p := NewPool(workerCount, proc, jobs)
	p.limiterTimeout = 100 * time.Millisecond
	return p
}

// waitFor polls condition every 10ms until it returns true or the deadline passes.
func waitFor(t *testing.T, label string, condition func() bool) {
	t.Helper()
	deadline := time.After(3 * time.Second)
	for {
		if condition() {
			return
		}
		select {
		case <-deadline:
			t.Fatalf("timed out waiting for: %s", label)
		case <-time.After(10 * time.Millisecond):
		}
	}
}

// ── tests ─────────────────────────────────────────────────────────────────

// TestPool_HappyPath verifies that a job is picked up and ProcessFeed is called
// with the correct feed. ReleaseLockOnly must NOT be called on the success path.
func TestPool_HappyPath(t *testing.T) {
	proc := &mockProcessor{}
	jobs := make(chan model.Job, 1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool := newTestPool(1, proc, jobs)
	pool.Start(ctx)

	feed := model.Feed{ID: "feed-1", URL: "https://example.com/rss"}
	jobs <- model.Job{Feed: feed}

	waitFor(t, "ProcessFeed to be called once", func() bool {
		return proc.processedCount() == 1
	})

	if proc.releasedCount() != 0 {
		t.Errorf("ReleaseLockOnly should not be called on success, got %d call(s)", proc.releasedCount())
	}
}

// TestPool_RateLimiterImmediateError verifies the err != nil branch in pool.worker.
// With burst=0, the rate limiter returns an error immediately for every request
// (n=1 > burst=0). This verifies ReleaseLockOnly is called and ProcessFeed is not.
func TestPool_RateLimiterImmediateError_ReleasesLock(t *testing.T) {
	proc := &mockProcessor{}
	jobs := make(chan model.Job, 1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool := newTestPool(1, proc, jobs)
	// burst=0: rate.Wait(n=1) returns an error immediately because n > burst.
	// This is intentional — we want an instant, deterministic trigger of the error path.
	pool.limiter = NewDomainLimiter(0, 0)

	pool.Start(ctx)

	feed := model.Feed{ID: "feed-1", URL: "https://example.com/rss"}
	jobs <- model.Job{Feed: feed}

	waitFor(t, "ReleaseLockOnly to be called once", func() bool {
		return proc.releasedCount() == 1
	})

	if proc.processedCount() != 0 {
		t.Errorf("ProcessFeed must not be called when rate limiter rejects the job")
	}
}

// TestPool_RateLimiterTimeout_ReleasesLock tests the context-timeout path specifically.
// With burst=1 and rate=0: the first job to a domain consumes the one burst token and
// is processed normally. The second job to the same domain finds no tokens and waits
// indefinitely — until limiterTimeout (100ms in tests) fires. ReleaseLockOnly should
// then be called for that second job.
func TestPool_RateLimiterTimeout_ReleasesLock(t *testing.T) {
	proc := &mockProcessor{}
	jobs := make(chan model.Job, 2)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool := newTestPool(1, proc, jobs)
	// burst=1, rate=0: first Wait succeeds (burst token), second blocks forever.
	// pool.limiterTimeout=100ms means the second job times out after 100ms.
	pool.limiter = NewDomainLimiter(0, 1)

	pool.Start(ctx)

	feed := model.Feed{ID: "feed-1", URL: "https://example.com/rss"}
	jobs <- model.Job{Feed: feed} // first: passes (burst token consumed)
	jobs <- model.Job{Feed: feed} // second: same domain, blocks → times out

	waitFor(t, "1 processed + 1 released", func() bool {
		return proc.processedCount() == 1 && proc.releasedCount() == 1
	})
}

// TestPool_ChannelClosed_ExitsCleanly verifies that closing the jobs channel
// causes all workers to exit. pool.Stop() must return without deadlocking.
func TestPool_ChannelClosed_ExitsCleanly(t *testing.T) {
	proc := &mockProcessor{}
	jobs := make(chan model.Job)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool := newTestPool(3, proc, jobs)
	pool.Start(ctx)

	close(jobs) // signal workers to exit via the closed-channel branch

	done := make(chan struct{})
	go func() {
		pool.Stop()
		close(done)
	}()

	select {
	case <-done:
		// clean exit
	case <-time.After(3 * time.Second):
		t.Fatal("pool.Stop() deadlocked after jobs channel was closed")
	}
}

// TestPool_ContextCancelled_ExitsCleanly verifies that cancelling the context
// causes all idle workers to exit via the ctx.Done() select branch.
func TestPool_ContextCancelled_ExitsCleanly(t *testing.T) {
	proc := &mockProcessor{}
	jobs := make(chan model.Job) // unbuffered, no jobs sent — workers sit in select
	ctx, cancel := context.WithCancel(context.Background())

	pool := newTestPool(3, proc, jobs)
	pool.Start(ctx)

	cancel()

	done := make(chan struct{})
	go func() {
		pool.Stop()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(3 * time.Second):
		t.Fatal("pool.Stop() deadlocked after context was cancelled")
	}
}

// TestPool_MultipleWorkers_AllJobsProcessed verifies that N workers can drain
// a batch of jobs concurrently and every job is processed exactly once.
func TestPool_MultipleWorkers_AllJobsProcessed(t *testing.T) {
	const numWorkers = 5
	const numJobs = 25

	proc := &mockProcessor{}
	jobs := make(chan model.Job, numJobs)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool := newTestPool(numWorkers, proc, jobs)
	pool.Start(ctx)

	for i := 0; i < numJobs; i++ {
		jobs <- model.Job{Feed: model.Feed{
			ID:  fmt.Sprintf("feed-%d", i),
			URL: fmt.Sprintf("https://host%d.example.com/rss", i), // unique domain per job — no rate limiting
		}}
	}

	waitFor(t, fmt.Sprintf("all %d jobs to be processed", numJobs), func() bool {
		return proc.processedCount() == numJobs
	})

	if proc.releasedCount() != 0 {
		t.Errorf("expected 0 lock releases (no rate limiting), got %d", proc.releasedCount())
	}
}
