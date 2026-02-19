package model

import (
	"time"
)

// Feed represents an RSS/Atom feed subscription.
type Feed struct {
	ID              string
	UserID          string
	URL             string
	RefreshInterval time.Duration
	ErrorCount      int
	Status          string
	NextFetchAfter  time.Time
	ForceRefresh    bool
	FetchingAt      *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// Article represents a single parsed item from a feed.
type Article struct {
	ID           string
	FeedID       string
	UserID       string
	GUID         *string
	Title        string
	URL          string
	Author       *string
	PublishedAt  *time.Time
	Summary      *string
	IdentityHash string // Computed hash to prevent duplicate inserts
	CreatedAt    time.Time
}

// Job represents a unit of work for the scheduler pool.
type Job struct {
	Feed Feed
}
