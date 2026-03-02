package worker

import (
	"context"
	"net/url"
	"sync"

	"golang.org/x/time/rate"
)

// DomainLimiter makes sure the scheduler doesn't blast the same host with concurrent requests in a short time
type DomainLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	rate     rate.Limit
	burst    int
}

// NewDomainLimiter creates a new limiter.
// eventsPerSecond determines how fast we can hit a single domain.
// burst determines how many requests can hit simultaneously before the limit kicks in.
// references -> https://en.wikipedia.org/wiki/Token_bucket; https://pkg.go.dev/golang.org/x/time/rate
func NewDomainLimiter(eventsPerSecond float64, burst int) *DomainLimiter {
	return &DomainLimiter{
		limiters: make(map[string]*rate.Limiter),
		rate:     rate.Limit(eventsPerSecond),
		burst:    burst,
	}
}

// Wait blocks the current goroutine until it is safe to make a request to the given URL.
func (l *DomainLimiter) Wait(ctx context.Context, feedURL string) error {
	parsedURL, err := url.Parse(feedURL)
	if err != nil {
		return nil
	}

	host := parsedURL.Host

	l.mu.Lock()
	limiter, exists := l.limiters[host]
	if !exists {
		limiter = rate.NewLimiter(l.rate, l.burst)
		l.limiters[host] = limiter
	}
	l.mu.Unlock()

	return limiter.Wait(ctx)
}
