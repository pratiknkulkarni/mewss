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
	for range 50 {
		wg.Go(func() {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			err := limiter.Wait(ctx, "https://news.ycombinator.com/rss")
			if err != nil {
				t.Errorf("limiter wait failed: %v", err)
			}
		})
	}

	for range 50 {
		wg.Go(func() {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			err := limiter.Wait(ctx, "https://financialpost.com/feed")
			if err != nil {
				t.Errorf("limiter wait failed: %v", err)
			}
		})
	}

	wg.Wait()
}

// Run this test only if setting the sweep loop interval to 1 second and deletion interval to 1 Nano seconds
//func TestDomainLimiter_MemoryLeak(t *testing.T) {
//	// 100 tokens per sec so the test runs instantly
//	limiter := NewDomainLimiter(100, 1)
//	ctx := context.Background()
//
//	var m1, m2 runtime.MemStats
//
//	runtime.GC()
//	runtime.ReadMemStats(&m1)
//
//	// Simulate scraping 100,000 unique blogs over a few months
//	for i := 0; i < 100000; i++ {
//		fakeURL := fmt.Sprintf("https://random-blog-%d.com/rss", i)
//		_ = limiter.Wait(ctx, fakeURL)
//	}
//
//	// sleep 3 seconds for sweeping
//	time.Sleep(time.Second * 3)
//
//	runtime.GC()
//	runtime.ReadMemStats(&m2)
//
//	leakedBytes := m2.Alloc - m1.Alloc
//	leakedMB := leakedBytes / 1024 / 1024
//
//	t.Logf("Baseline RAM: %d MB", m1.Alloc/1024/1024)
//	t.Logf("Ending RAM: %d MB", m2.Alloc/1024/1024)
//	t.Logf("TOTAL PERMANENT LEAK: %d MB", leakedMB)
//
//	if leakedMB > 0 {
//		t.Errorf("Limiter leaked %d MB of memory!", leakedMB)
//	}
//}
