package service

import (
	"feedscheduler/internal/fetcher"
	"feedscheduler/internal/repository"
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
