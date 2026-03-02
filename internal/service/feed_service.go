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
	"math"
	"math/rand"
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
func (s *FeedService) ProcessFeed(ctx context.Context, feed model.Feed) {
	logger := slog.With("feed_id", feed.ID, "url", feed.URL)

	fetchCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	parsedFeed, err := s.fetcher.Fetch(fetchCtx, feed.URL, feed.ETag, feed.LastModifiedHeader)
	defer cancel()

	if err != nil {
		logger.Warn("failed to fetch feed", "error", err, "current_errors", feed.ErrorCount)

		newErrorCount := feed.ErrorCount + 1
		backOffMinutes := math.Pow(2, float64(newErrorCount))

		// backoff > 24 hours, cap it at that
		if backOffMinutes > 1440 {
			backOffMinutes = 1440
		}

		// jitter -> randomize the backoff by +/- 20%
		// reference - https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
		jitterFactor := 0.8 + (0.4 * rand.Float64())
		actualBackoffMinutes := backOffMinutes * jitterFactor

		backoffDuration := time.Duration(actualBackoffMinutes * float64(time.Minute))
		nextFetch := time.Now().Add(feed.RefreshInterval).Add(backoffDuration)

		logger.Info("scheduling feed with backoff", "next_fetch", nextFetch, "error_count", newErrorCount)

		// changing the context here for a fresh one since the queries fail if parent dies
		if err := s.repo.MarkFeedAsFailed(context.Background(), feed.ID, newErrorCount, nextFetch); err != nil {
			logger.Error("failed to mark feed as failed in db", "error", err)
		}

		return
	}

	// if the etag is same, we don't make a request and skip early
	if parsedFeed.NotModified {
		logger.Info("feed not modified (304), skipping parsing")
		nextFetch := time.Now().Add(feed.RefreshInterval)

		if err := s.repo.ReleaseFeed(context.Background(), feed.ID, nextFetch, 0, feed.ETag, feed.LastModifiedHeader); err != nil {
			logger.Error("failed to release feed lock", "error", err)
		}
		return
	}

	for _, item := range parsedFeed.Feed.Items {
		article := s.mapToArticle(feed, item)
		if err := s.repo.SaveArticle(context.Background(), &article); err != nil {
			logger.Error("failed to save article", "article_title", article.Title, "error", err)
			continue
		}
	}
	nextFetch := time.Now().Add(feed.RefreshInterval)
	if err := s.repo.ReleaseFeed(context.Background(), feed.ID, nextFetch, 0, parsedFeed.Etag, parsedFeed.LastModified); err != nil {
		logger.Error("failed to release feed lock after success", "error", err)
	} else {
		logger.Info("feed processed successfully, lock released", "articles_found", len(parsedFeed.Feed.Items))
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
