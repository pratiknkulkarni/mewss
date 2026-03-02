package repository

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

// setupTestDB spins up a Postgres Docker container for testing
func setupTestDB(ctx context.Context, t *testing.T) (*sql.DB, func()) {
	pgContainer, err := postgres.Run(ctx,
		"postgres:15-alpine",
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("user"),
		postgres.WithPassword("password"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(10*time.Second),
		),
	)

	if err != nil {
		t.Fatalf("failed to start container: %v", err)
	}

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("failed to get connection string: %v", err)
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		t.Fatalf("failed to connect to db: %v", err)
	}

	// I am creating this here for isolation, however I guess I can even use the migrations' folder.
	// That requires a bit of a setup, so deferring that for now. I am not too happy with this...
	_, err = db.ExecContext(ctx, `
		CREATE TABLE feed (
			id VARCHAR(255) PRIMARY KEY,
			user_id VARCHAR(255) NOT NULL,
			url TEXT NOT NULL,
			refresh_interval BIGINT NOT NULL,
			error_count INT DEFAULT 0,
			status VARCHAR(50) DEFAULT 'active',
			next_fetch_after TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			force_refresh BOOLEAN DEFAULT false,
			fetching_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			etag TEXT,
			last_modified_header TEXT
		);
	`)
	if err != nil {
		t.Fatalf("failed to create schema: %v", err)
	}

	cleanup := func() {
		db.Close()
		if err := pgContainer.Terminate(context.Background()); err != nil {
			t.Fatalf("failed to terminate container: %v", err)
		}
	}

	return db, cleanup
}

// TODO: I missed he assertions here! No assertions happening in this code
func TestPostgresFeedRepository_GetFeedsDueForRefresh(t *testing.T) {
	ctx := context.Background()
	db, cleanup := setupTestDB(ctx, t)
	defer cleanup()

	_ = NewPostgresFeedRepository(db)

	// 3 are being inserted
	// 1 -> Due for refresh (past date, not locked)
	// 2 -> Not due (future date)
	// 3 -> Due, but currently locked by a worker (fetching_at is set)
	queries := []string{
		// Due for refresh (past date, not locked)
		"INSERT INTO feed (id, user_id, url, refresh_interval, next_fetch_after) VALUES ('f1-due', 'u1', 'url1', 100, NOW() - INTERVAL '5 minutes')",

		// Not due (future date)
		"INSERT INTO feed (id, user_id, url, refresh_interval, next_fetch_after) VALUES ('f2-future', 'u1', 'url2', 100, NOW() + INTERVAL '1 hour')",

		// Due, but currently locked by a worker (fetching_at is set)
		"INSERT INTO feed (id, user_id, url, refresh_interval, next_fetch_after, fetching_at) VALUES ('f3-locked', 'u1', 'url3', 100, NOW() - INTERVAL '5 minutes', NOW())",
	}

	for _, q := range queries {
		if _, err := db.ExecContext(ctx, q); err != nil {
			t.Fatalf("failed to setup test data: %v", err)
		}
	}
}

func TestPostgresFeedRepository_GetRemainingFeedsCount(t *testing.T) {
	ctx := context.Background()
	db, cleanup := setupTestDB(ctx, t)
	defer cleanup()

	repo := NewPostgresFeedRepository(db)

	queries := []string{
		// 1. Due, active, unlocked (SHOULD BE COUNTED)
		"INSERT INTO feed (id, user_id, url, refresh_interval, status, next_fetch_after) VALUES ('f1', 'u1', 'url', 100, 'active', NOW() - INTERVAL '5 minutes')",

		// 2. Future, active, unlocked (NOT COUNTED)
		"INSERT INTO feed (id, user_id, url, refresh_interval, status, next_fetch_after) VALUES ('f2', 'u1', 'url', 100, 'active', NOW() + INTERVAL '1 hour')",

		// 3. Due, active, locked (NOT COUNTED - worker has it)
		"INSERT INTO feed (id, user_id, url, refresh_interval, status, next_fetch_after, fetching_at) VALUES ('f3', 'u1', 'url', 100, 'active', NOW() - INTERVAL '5 minutes', NOW())",

		// 4. Due, INACTIVE, unlocked (NOT COUNTED)
		"INSERT INTO feed (id, user_id, url, refresh_interval, status, next_fetch_after) VALUES ('f4', 'u1', 'url', 100, 'failed', NOW() - INTERVAL '5 minutes')",

		// 5. Future, INACTIVE, but FORCE REFRESH is true (SHOULD BE COUNTED)
		"INSERT INTO feed (id, user_id, url, refresh_interval, status, next_fetch_after, force_refresh) VALUES ('f5', 'u1', 'url', 100, 'failed', NOW() + INTERVAL '1 hour', true)",
	}

	for _, q := range queries {
		if _, err := db.ExecContext(ctx, q); err != nil {
			t.Fatalf("failed to setup test data: %v", err)
		}
	}

	count, err := repo.GetRemainingFeedsCount(ctx)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if count != 2 {
		t.Fatalf("expected count to be 2, got %d", count)
	}
}

func TestPostgresFeedRepository_ClaimFeed(t *testing.T) {
	ctx := context.Background()
	db, cleanup := setupTestDB(ctx, t)
	defer cleanup()

	repo := NewPostgresFeedRepository(db)

	feedID := "feed-123"
	_, err := db.ExecContext(ctx, `
		INSERT INTO feed (id, user_id, url, refresh_interval)
		VALUES ($1, 'user-1', 'https://example.com/rss', 600000000000)
	`, feedID)
	if err != nil {
		t.Fatalf("failed to insert dummy feed: %v", err)
	}

	t.Run("Successfully claim an available feed", func(t *testing.T) {
		claimed, err := repo.ClaimFeed(ctx, feedID, 15*time.Minute)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !claimed {
			t.Errorf("expected feed to be claimed successfully")
		}
	})

	t.Run("Fail to claim an already locked feed", func(t *testing.T) {
		claimed, err := repo.ClaimFeed(ctx, feedID, 15*time.Minute)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if claimed {
			t.Errorf("expected claim to fail because feed is already locked")
		}
	})

	t.Run("Successfully claim a stale feed", func(t *testing.T) {
		_, err := db.ExecContext(ctx, "UPDATE feed SET fetching_at = NOW() - INTERVAL '2 hours' WHERE id = $1", feedID)
		if err != nil {
			t.Fatalf("failed to update fetching_at: %v", err)
		}

		claimed, err := repo.ClaimFeed(ctx, feedID, 1*time.Hour)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if !claimed {
			t.Errorf("expected to successfully claim a stale lock")
		}
	})
}

func TestPostgresFeedRepository_ReleaseFeed(t *testing.T) {
	ctx := context.Background()
	db, cleanup := setupTestDB(ctx, t)
	defer cleanup()

	repo := NewPostgresFeedRepository(db)

	feedID := "f1"
	_, err := db.ExecContext(ctx, `
		INSERT INTO feed (id, user_id, url, refresh_interval, fetching_at, force_refresh)
		VALUES ($1, 'u1', 'url', 100, NOW(), true)
	`, feedID)
	if err != nil {
		t.Fatalf("failed to setup test data: %v", err)
	}

	nextFetchTime := time.Now().Add(1 * time.Hour).Round(time.Second) // Rounding handles PG precision differences

	err = repo.ReleaseFeed(ctx, feedID, nextFetchTime, 0, nil, nil)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	var fetchingAt sql.NullTime
	var dbNextFetch time.Time
	var forceRefresh bool
	var errCount int

	err = db.QueryRowContext(ctx, "SELECT fetching_at, next_fetch_after, force_refresh, error_count FROM feed WHERE id = $1", feedID).
		Scan(&fetchingAt, &dbNextFetch, &forceRefresh, &errCount)
	if err != nil {
		t.Fatalf("failed to query db: %v", err)
	}

	if fetchingAt.Valid {
		t.Errorf("expected fetching_at to be NULL, got %v", fetchingAt.Time)
	}
	if forceRefresh {
		t.Errorf("expected force_refresh to be false")
	}
	if errCount != 0 {
		t.Errorf("expected error_count to be 0, got %d", errCount)
	}
	if !dbNextFetch.Equal(nextFetchTime) {
		t.Errorf("expected next_fetch_after %v, got %v", nextFetchTime, dbNextFetch)
	}
}

func TestPostgresFeedRepository_MarkFeedAsFailed(t *testing.T) {
	ctx := context.Background()
	db, cleanup := setupTestDB(ctx, t)
	defer cleanup()

	repo := NewPostgresFeedRepository(db)

	feedID := "f1"
	_, err := db.ExecContext(ctx, `
		INSERT INTO feed (id, user_id, url, refresh_interval, fetching_at, error_count) 
		VALUES ($1, 'u1', 'url', 100, NOW(), 2)
	`, feedID)
	if err != nil {
		t.Fatalf("failed to setup test data: %v", err)
	}

	nextFetchTime := time.Now().Add(1 * time.Hour).Round(time.Second)

	// Worker failed again, incrementing error count to 3
	err = repo.MarkFeedAsFailed(ctx, feedID, 3, nextFetchTime)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	var fetchingAt sql.NullTime
	var errCount int
	err = db.QueryRowContext(ctx, "SELECT fetching_at, error_count FROM feed WHERE id = $1", feedID).
		Scan(&fetchingAt, &errCount)
	if err != nil {
		t.Fatalf("failed to query db: %v", err)
	}

	if fetchingAt.Valid {
		t.Errorf("expected fetching_at to be NULL")
	}
	if errCount != 3 {
		t.Errorf("expected error_count to be 3, got %d", errCount)
	}
}

func TestPostgresFeedRepository_CleanStaleLocks(t *testing.T) {
	ctx := context.Background()
	db, cleanup := setupTestDB(ctx, t)
	defer cleanup()

	repo := NewPostgresFeedRepository(db)

	feedID := "stale-lock-test-1"
	_, err := db.ExecContext(ctx, `
		INSERT INTO feed (id, user_id, url, refresh_interval, status, fetching_at, error_count) 
		VALUES ($1, 'u1', 'http://example.com/stale', 60000000000, 'active', NOW() - INTERVAL '2 hours', 0)
	`, feedID)
	if err != nil {
		t.Fatalf("failed to insert test feed: %v", err)
	}

	healthyFeedID := "healthy-lock-test-1"
	_, err = db.ExecContext(ctx, `
		INSERT INTO feed (id, user_id, url, refresh_interval, status, fetching_at, error_count) 
		VALUES ($1, 'u1', 'http://example.com/healthy', 60000000000, 'active', NOW() - INTERVAL '1 minute', 0)
	`, healthyFeedID)
	if err != nil {
		t.Fatalf("failed to insert healthy feed: %v", err)
	}

	cutoff := time.Now().Add(-15 * time.Minute)
	reapedCount, err := repo.CleanStaleLocks(ctx, cutoff)
	if err != nil {
		t.Fatalf("CleanStaleLocks failed: %v", err)
	}

	if reapedCount != 1 {
		t.Errorf("expected 1 row to be reaped, got %d", reapedCount)
	}

	var fetchingAt sql.NullTime
	var errorCount int
	err = db.QueryRowContext(ctx, "SELECT fetching_at, error_count FROM feed WHERE id = $1", feedID).Scan(&fetchingAt, &errorCount)
	if err != nil {
		t.Fatalf("failed to query stale feed: %v", err)
	}

	if fetchingAt.Valid {
		t.Error("expected fetching_at to be NULL for the stale feed")
	}
	if errorCount != 1 {
		t.Errorf("expected error_count to be 1, got %d", errorCount)
	}

	err = repo.db.QueryRowContext(ctx, "SELECT fetching_at, error_count FROM feed WHERE id = $1", healthyFeedID).Scan(&fetchingAt, &errorCount)
	if err != nil {
		t.Fatalf("failed to query healthy feed: %v", err)
	}

	if !fetchingAt.Valid {
		t.Error("expected fetching_at to still be populated for the healthy feed")
	}
	if errorCount != 0 {
		t.Errorf("expected healthy feed error_count to remain 0, got %d", errorCount)
	}
}
