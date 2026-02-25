package service

import (
	"context"
	"feedscheduler/internal/fetcher"
	"feedscheduler/internal/model"
	"feedscheduler/internal/repository"
	"log/slog"
)

// FeedService orchestrates the business logic of fetching and saving feeds.
type FeedService struct {
	repo    repository.FeedRepository
	fetcher fetcher.Fetcher
}

func NewFeedService(repo repository.FeedRepository, fetcher fetcher.Fetcher) *FeedService {
	return &FeedService{
		repo:    repo,
		fetcher: fetcher,
	}
}

// ProcessFeed handles the processing of one feed at a time. Entire lifecycle. At least I hope it'll
func (s *FeedService) ProcessFeed(ctx context.Context, feed model.Feed) {
	logger := slog.With("feed_id", feed.ID, "url", feed.URL)

	logger.Debug("we are in the process feed")

	// try getting the lock
	isClaimed, err := s.repo.ClaimFeed(ctx, feed.ID)
	if err != nil {
		logger.Error("failed to claim feed lock", "error", err)
		return
	}

	if !isClaimed {
		logger.Debug("feed already claimed by another worker, skipping")
		return
	}

	logger.Debug("fetching feed with id %d\n", feed.ID)

	// if gotten -> fetch the feed from internet using that fetcher.Fetch. If not -> just fail
	// if fetching works, insert into db AND release lock
}
