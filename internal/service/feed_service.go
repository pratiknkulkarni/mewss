package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"feedscheduler/internal/fetcher"
	"feedscheduler/internal/model"
	"feedscheduler/internal/repository"
	"fmt"
	"log/slog"
	"time"

	"github.com/mmcdole/gofeed"
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
func (s *FeedService) ProcessFeed(ctx context.Context, feed model.Feed, staleThreshold time.Duration) {
	logger := slog.With("feed_id", feed.ID, "url", feed.URL)

	// try getting the lock
	isClaimed, err := s.repo.ClaimFeed(ctx, feed.ID, staleThreshold)
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
	parsedFeed, err := s.fetcher.Fetch(ctx, feed.URL)

	logger.Debug(parsedFeed.Title, parsedFeed.Categories)

	if err != nil {
		logger.Warn("failed to fetch feed", "error", err, "current_errors", feed.ErrorCount)
		return
	}

	for _, item := range parsedFeed.Items {
		article := s.mapToArticle(feed, item)
		if err := s.repo.SaveArticle(ctx, &article); err != nil {
			logger.Error("failed to save article", "article_title", article.Title, "error", err)
			continue
		}
	}
	nextFetch := time.Now().Add(feed.RefreshInterval)
	if err := s.repo.ReleaseFeed(ctx, feed.ID, nextFetch, 0); err != nil {
		logger.Error("failed to release feed lock after success", "error", err)
	} else {
		logger.Info("feed processed successfully, lock released", "articles_found", len(parsedFeed.Items))
	}
}

// mapToArticle converts a gofeed.Item into the domain model
func (s *FeedService) mapToArticle(feed model.Feed, item *gofeed.Item) model.Article {
	hashStr := fmt.Sprintf("%s:%s:%s", feed.ID, item.Title, item.Link)
	hash := sha256.Sum256([]byte(hashStr))
	identityHash := hex.EncodeToString(hash[:])
	var guid *string
	if item.GUID != "" {
		guid = &item.GUID
	}

	var author *string
	if item.Authors != nil {
		author = &item.Authors[0].Name // taking first one for now, maybe map over all of them?
	}

	var summary *string
	if item.Description != "" {
		summary = &item.Description
	}

	article := model.Article{
		FeedID:       feed.ID,
		UserID:       feed.UserID,
		GUID:         guid,
		Title:        item.Title,
		URL:          item.Link,
		Author:       author,
		PublishedAt:  item.PublishedParsed,
		Summary:      summary,
		IdentityHash: identityHash,
	}

	return article
}
