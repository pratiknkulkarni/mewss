package worker

import (
	"context"
	"net/url"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// domainEntry wraps a limiter with a timestamp so the sweeper knows when to evict it.
// If this does not happen, the memory keeps on increasing since GC isn't there for maps.
type domainEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// DomainLimiter makes sure the scheduler doesn't blast the same host with concurrent requests in a short time
type DomainLimiter struct {
	mu       sync.Mutex
	limiters map[string]*domainEntry
	rate     rate.Limit
	burst    int
}

// NewDomainLimiter creates a new limiter.
// eventsPerSecond determines how fast we can hit a single domain.
// burst determines how many requests can hit simultaneously before the limit kicks in.
// references -> https://en.wikipedia.org/wiki/Token_bucket; https://pkg.go.dev/golang.org/x/time/rate
func NewDomainLimiter(eventsPerSecond float64, burst int) *DomainLimiter {
	return &DomainLimiter{
		limiters: make(map[string]*domainEntry),
		rate:     rate.Limit(eventsPerSecond),
		burst:    burst,
	}
}

// sweepLoop wakes up every 10 minutes and purges dead domains to prevent OOM crashes.
func (l *DomainLimiter) sweepLoop(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Minute)
	//ticker := time.NewTicker(1 * time.Second) // only uncomment and comment above line for testing TestDomainLimiter_MemoryLeak
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			l.mu.Lock()
			now := time.Now()
			for host, entry := range l.limiters {
				if now.Sub(entry.lastSeen) > 1*time.Hour {
					// only uncomment and comment above line for testing TestDomainLimiter_MemoryLeak
					//if now.Sub(entry.lastSeen) > 1*time.Nanosecond {
					delete(l.limiters, host)
				}
			}
			l.mu.Unlock()
		}
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
	entry, exists := l.limiters[host]
	if !exists {
		entry = &domainEntry{
			limiter: rate.NewLimiter(l.rate, l.burst),
		}
		l.limiters[host] = entry
	}

	// update this timestamp for the sweepers
	entry.lastSeen = time.Now()
	limiter := entry.limiter
	l.mu.Unlock()

	return limiter.Wait(ctx)
}
