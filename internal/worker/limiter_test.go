package worker

import (
	"context"
	"sync"
	"testing"
	"time"
)

func TestDomainLimiter_Concurrency(t *testing.T) {
	limiter := NewDomainLimiter(100, 1)
	var wg sync.WaitGroup

	// 50 concurrent workers hitting ONE domain
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			err := limiter.Wait(ctx, "https://news.ycombinator.com/rss")
			if err != nil {
				t.Errorf("limiter wait failed: %v", err)
			}
		}()
	}

	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			err := limiter.Wait(ctx, "https://financialpost.com/feed")
			if err != nil {
				t.Errorf("limiter wait failed: %v", err)
			}
		}()
	}

	wg.Wait()
}
