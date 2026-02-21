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

	// I am creating this here for isolation, however I guess I can even use the migrations folder.
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
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
