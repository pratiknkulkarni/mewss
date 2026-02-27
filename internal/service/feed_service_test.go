package service

import (
	"context"
	"errors"
	"feedscheduler/internal/model"
	"feedscheduler/internal/repository"
	"testing"
	"time"

	"github.com/mmcdole/gofeed"
)

type mockFetcher struct {
	feed *gofeed.Feed
	err  error
}

func (m *mockFetcher) Fetch(_ context.Context, _ string) (*gofeed.Feed, error) {
	return m.feed, m.err
}

type mockRepo struct {
	repository.FeedRepository
	claimResult    bool
	articlesSaved  int
	markedFailed   bool
	lastErrorCount int
	lastNextFetch  time.Time
}

func (m *mockRepo) ClaimFeed(_ context.Context, _ string, _ time.Duration) (bool, error) {
	return m.claimResult, nil
}

func (m *mockRepo) SaveArticle(_ context.Context, _ *model.Article) error {
	m.articlesSaved++
	return nil
}

func (m *mockRepo) ReleaseFeed(_ context.Context, _ string, _ time.Time, _ int) error {
	return nil
}

func (m *mockRepo) MarkFeedAsFailed(_ context.Context, _ string, errCount int, nextFetch time.Time) error {
	m.markedFailed = true
	m.lastErrorCount = errCount
	m.lastNextFetch = nextFetch
	return nil
}

func TestFeedService_ProcessFeed_Success(t *testing.T) {
	repo := &mockRepo{claimResult: true}
	fetcher := &mockFetcher{
		feed: &gofeed.Feed{
			Items: []*gofeed.Item{
				{Title: "Article 1", Link: "http://example.com/1"},
				{Title: "Article 2", Link: "http://example.com/2"},
			},
		},
	}
	svc := NewFeedService(repo, fetcher)

	feed := model.Feed{ID: "feed-1", URL: "http://example.com/rss", RefreshInterval: 1 * time.Hour}

	svc.ProcessFeed(context.Background(), feed, 15*time.Minute)

	if repo.articlesSaved != 2 {
		t.Errorf("expected 2 articles to be saved, got %d", repo.articlesSaved)
	}
	if repo.markedFailed {
		t.Errorf("expected feed to not be marked as failed")
	}
}

func TestFeedService_ProcessFeed_ExponentialBackoff(t *testing.T) {
	repo := &mockRepo{claimResult: true}
	// network failure simulation
	fetcher := &mockFetcher{err: errors.New("network timeout")}
	svc := NewFeedService(repo, fetcher)

	// the feed already has 2 errors (hard coded in this test) => expected backoff = 2^(2 + 1) = 8 mins
	// Expected backoff: 2^(2+1) = 2^3 = 8 minutes.
	feed := model.Feed{
		ID:              "feed-1",
		RefreshInterval: 60 * time.Minute,
		ErrorCount:      2, // hard code
	}

	beforeRun := time.Now()
	svc.ProcessFeed(context.Background(), feed, 15*time.Minute)

	if !repo.markedFailed {
		t.Fatalf("expected feed to be marked as failed")
	}

	if repo.lastErrorCount != 3 {
		t.Errorf("expected error count to increment to 3, got %d", repo.lastErrorCount)
	}

	// considering the jitter for testing
	minExpected := 60*time.Minute + time.Duration(6.4*float64(time.Minute))
	maxExpected := 60*time.Minute + time.Duration(9.6*float64(time.Minute))

	actualDuration := repo.lastNextFetch.Sub(beforeRun)

	if actualDuration < minExpected || actualDuration > maxExpected {
		t.Errorf("expected duration between %v and %v, got %v", minExpected, maxExpected, actualDuration)
	}
}

func TestFeedService_ProcessFeed_AlreadyClaimed(t *testing.T) {
	repo := &mockRepo{claimResult: false}
	fetcher := &mockFetcher{err: errors.New("should not be called")}
	svc := NewFeedService(repo, fetcher)

	feed := model.Feed{ID: "feed-1"}

	// this should return immediately without calling the fetcher or saving anything
	svc.ProcessFeed(context.Background(), feed, 15*time.Minute)

	if repo.articlesSaved > 0 {
		t.Errorf("expected no articles saved")
	}
	if repo.markedFailed {
		t.Errorf("expected no failure marking")
	}
}
