package worker

import (
	"context"
	"sync"
	"testing"
	"time"

	"feedscheduler/internal/model"
)

// ── mock ──────────────────────────────────────────────────────────────────
// These tests were generated using Claude Sonnet 4.6

type mockSchedulerRepo struct {
	mu            sync.Mutex
	feeds         []model.Feed
	getFeedsCount int
	reaped        int64
	reaperCutoffs []time.Time
}

func (m *mockSchedulerRepo) GetFeedsDueForRefresh(_ context.Context, limit int) ([]model.Feed, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.getFeedsCount++
	if limit < len(m.feeds) {
		return m.feeds[:limit], nil
	}
	return m.feeds, nil
}

func (m *mockSchedulerRepo) CleanStaleLocks(_ context.Context, cutoff time.Time) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.reaperCutoffs = append(m.reaperCutoffs, cutoff)
	return m.reaped, nil
}

func (m *mockSchedulerRepo) callCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.getFeedsCount
}

func (m *mockSchedulerRepo) reaperCallCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.reaperCutoffs)
}

func (m *mockSchedulerRepo) lastReaperCutoff() time.Time {
	m.mu.Lock()
	defer m.mu.Unlock()
	if len(m.reaperCutoffs) == 0 {
		return time.Time{}
	}
	return m.reaperCutoffs[len(m.reaperCutoffs)-1]
}

// ── tests ─────────────────────────────────────────────────────────────────

// TestScheduler_QueueFeeds_SendsJobs verifies that feeds returned by the repo
// are pushed onto the jobs channel, one per feed.
func TestScheduler_QueueFeeds_SendsJobs(t *testing.T) {
	feeds := []model.Feed{
		{ID: "f1", URL: "https://a.com/rss"},
		{ID: "f2", URL: "https://b.com/rss"},
		{ID: "f3", URL: "https://c.com/rss"},
	}

	repo := &mockSchedulerRepo{feeds: feeds}
	jobs := make(chan model.Job, 10)

	s := NewScheduler(repo, jobs, 10*time.Second, 15*time.Minute, 10)
	s.queueFeeds(context.Background())

	if len(jobs) != len(feeds) {
		t.Fatalf("expected %d jobs on channel, got %d", len(feeds), len(jobs))
	}

	// Verify correct feed IDs were sent
	sentIDs := map[string]bool{}
	for len(jobs) > 0 {
		j := <-jobs
		sentIDs[j.Feed.ID] = true
	}
	for _, f := range feeds {
		if !sentIDs[f.ID] {
			t.Errorf("feed %q was not sent to the jobs channel", f.ID)
		}
	}
}

// TestScheduler_QueueFeeds_EmptyResult_NoBlock verifies that when no feeds are
// due, queueFeeds returns immediately without blocking or sending anything.
func TestScheduler_QueueFeeds_EmptyResult_NoBlock(t *testing.T) {
	repo := &mockSchedulerRepo{feeds: []model.Feed{}}
	jobs := make(chan model.Job) // unbuffered — any send would block forever

	s := NewScheduler(repo, jobs, 10*time.Second, 15*time.Minute, 10)

	done := make(chan struct{})
	go func() {
		s.queueFeeds(context.Background())
		close(done)
	}()

	select {
	case <-done:
		// returned cleanly
	case <-time.After(1 * time.Second):
		t.Fatal("queueFeeds blocked with no feeds to send")
	}

	if len(jobs) != 0 {
		t.Error("expected no jobs to be sent when repo returns empty slice")
	}
}

// TestScheduler_QueueFeeds_ContextCancelled_NoDeadlock verifies the defensive
// select inside queueFeeds: if the jobs channel is full and the context is cancelled
// mid-batch, queueFeeds returns rather than blocking forever.
func TestScheduler_QueueFeeds_ContextCancelled_NoDeadlock(t *testing.T) {
	feeds := []model.Feed{
		{ID: "f1"}, {ID: "f2"}, {ID: "f3"}, {ID: "f4"}, {ID: "f5"},
	}

	repo := &mockSchedulerRepo{feeds: feeds}
	jobs := make(chan model.Job, 1) // buffer of 1 — second send will block
	ctx, cancel := context.WithCancel(context.Background())

	s := NewScheduler(repo, jobs, 10*time.Second, 15*time.Minute, 10)

	// Cancel context shortly after the first job is sent, before queueFeeds can send the rest.
	go func() {
		time.Sleep(20 * time.Millisecond)
		cancel()
	}()

	done := make(chan struct{})
	go func() {
		s.queueFeeds(ctx)
		close(done)
	}()

	select {
	case <-done:
		// did not deadlock
	case <-time.After(2 * time.Second):
		t.Fatal("queueFeeds deadlocked when context was cancelled mid-batch")
	}
}

// TestScheduler_QueueFeeds_RespectsLimit verifies that batchSize is passed to
// GetFeedsDueForRefresh and the repo's limit is honoured.
func TestScheduler_QueueFeeds_RespectsLimit(t *testing.T) {
	feeds := []model.Feed{
		{ID: "f1"}, {ID: "f2"}, {ID: "f3"}, {ID: "f4"}, {ID: "f5"},
	}

	repo := &mockSchedulerRepo{feeds: feeds}
	jobs := make(chan model.Job, 10)
	const batchSize = 2

	s := NewScheduler(repo, jobs, 10*time.Second, 15*time.Minute, batchSize)
	s.queueFeeds(context.Background())

	// mock repo respects limit in GetFeedsDueForRefresh
	if len(jobs) != batchSize {
		t.Fatalf("expected %d jobs (batchSize), got %d", batchSize, len(jobs))
	}
}

// TestScheduler_ReapStaleLocks_CallsRepoWithCorrectCutoff verifies that
// reapStaleLocks passes a cutoff of approximately now - staleLockCutoff.
func TestScheduler_ReapStaleLocks_CallsRepoWithCorrectCutoff(t *testing.T) {
	repo := &mockSchedulerRepo{reaped: 0}
	jobs := make(chan model.Job, 10)
	staleLockCutoff := 15 * time.Minute

	s := NewScheduler(repo, jobs, 10*time.Second, staleLockCutoff, 10)

	before := time.Now()
	s.reapStaleLocks(context.Background())
	after := time.Now()

	if repo.reaperCallCount() != 1 {
		t.Fatalf("expected CleanStaleLocks to be called once, got %d", repo.reaperCallCount())
	}

	cutoff := repo.lastReaperCutoff()
	expectedMin := before.Add(-staleLockCutoff)
	expectedMax := after.Add(-staleLockCutoff)

	if cutoff.Before(expectedMin) || cutoff.After(expectedMax) {
		t.Errorf("cutoff %v is outside expected range [%v, %v]", cutoff, expectedMin, expectedMax)
	}
}

// TestScheduler_ReapStaleLocks_ZeroReleased verifies that when no locks are reaped,
// the function still calls the repo and returns cleanly (no logging assertions here —
// just verifying it doesn't panic or skip the repo call).
func TestScheduler_ReapStaleLocks_ZeroReleased(t *testing.T) {
	repo := &mockSchedulerRepo{reaped: 0}
	jobs := make(chan model.Job)

	s := NewScheduler(repo, jobs, 10*time.Second, 15*time.Minute, 10)
	s.reapStaleLocks(context.Background())

	if repo.reaperCallCount() != 1 {
		t.Errorf("expected CleanStaleLocks to be called even when count is 0")
	}
}

// TestScheduler_Start_PollsImmediately verifies that Start calls GetFeedsDueForRefresh
// once right away before the first tick — important so feeds aren't left waiting
// for a full poll interval on startup.
func TestScheduler_Start_PollsImmediately(t *testing.T) {
	repo := &mockSchedulerRepo{}
	jobs := make(chan model.Job, 100)
	ctx, cancel := context.WithCancel(context.Background())

	s := NewScheduler(repo, jobs, 1*time.Hour, 15*time.Minute, 10) // long poll interval — only initial call fires
	go s.Start(ctx)

	time.Sleep(50 * time.Millisecond)
	cancel()

	if repo.callCount() < 1 {
		t.Error("expected GetFeedsDueForRefresh to be called immediately on Start, before first tick")
	}
}

// TestScheduler_Start_PollsOnInterval verifies that queueFeeds is called repeatedly
// according to pollInterval. Uses a short interval to keep the test fast.
func TestScheduler_Start_PollsOnInterval(t *testing.T) {
	repo := &mockSchedulerRepo{}
	jobs := make(chan model.Job, 100)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pollInterval := 40 * time.Millisecond
	s := NewScheduler(repo, jobs, pollInterval, 15*time.Minute, 10)
	go s.Start(ctx)

	// Wait ~4 poll intervals. Expect: 1 immediate + at least 3 from ticks.
	time.Sleep(200 * time.Millisecond)
	cancel()

	calls := repo.callCount()
	if calls < 4 {
		t.Errorf("expected at least 4 poll calls after 200ms with 40ms interval, got %d", calls)
	}
}

// TestScheduler_Start_ExitsOnContextCancel verifies that Start returns when
// the context is cancelled and doesn't leave a goroutine blocked.
func TestScheduler_Start_ExitsOnContextCancel(t *testing.T) {
	repo := &mockSchedulerRepo{}
	jobs := make(chan model.Job, 10)
	ctx, cancel := context.WithCancel(context.Background())

	s := NewScheduler(repo, jobs, 1*time.Second, 15*time.Minute, 10)

	done := make(chan struct{})
	go func() {
		s.Start(ctx)
		close(done)
	}()

	cancel()

	select {
	case <-done:
		// clean exit
	case <-time.After(2 * time.Second):
		t.Fatal("Start did not exit after context was cancelled")
	}
}

// TestScheduler_ReaperInterval_DerivedFromCutoff verifies that reaperInterval is
// staleLockCutoff / 4. Uses a short cutoff to make the maths easy to assert.
func TestScheduler_ReaperInterval_DerivedFromCutoff(t *testing.T) {
	cutoff := 20 * time.Second
	s := NewScheduler(nil, nil, 1*time.Hour, cutoff, 10)

	expected := cutoff / 4 // 5 seconds
	if s.reaperInterval != expected {
		t.Errorf("expected reaperInterval %v (cutoff/4), got %v", expected, s.reaperInterval)
	}
}
