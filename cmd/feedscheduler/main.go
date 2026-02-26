package main

import (
	"context"
	"feedscheduler/internal/config"
	"feedscheduler/internal/database"
	"feedscheduler/internal/fetcher"
	"feedscheduler/internal/logger"
	"feedscheduler/internal/model"
	"feedscheduler/internal/repository"
	"feedscheduler/internal/service"
	"fmt"
	"log"
	"log/slog"
	"os"
	"time"
)

func main() {
	//TODO:
	//THIS IS A TEST FILE, I MAY DELETE THIS LATER ON
	//JUST CHECKING IF THE CONFIG WORKS
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	logger.InitLogger(cfg.AppEnv, cfg.LogLevel)

	slog.Info("starting rss scheduler",
		"env", cfg.AppEnv,
		"log level", cfg.LogLevel,
		"version", "1.0.0",
	)

	slog.Debug("this won't show unless level is debug, hopefully")

	dbURL := cfg.TestDatabaseURL
	fmt.Println(dbURL)
	db, err := database.Connect(dbURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	defer db.Close()

	//if err := database.RunMigrations(db); err != nil {
	//	slog.Error("failed to run database migrations", "error", err)
	//	os.Exit(1)
	//}

	//manual testing
	repo := repository.NewPostgresFeedRepository(db)
	netFetcher := fetcher.NewGoFeedFetcher(10*time.Second, "RSS-Scheduler-Test/1.0")
	svc := service.NewFeedService(repo, netFetcher)

	feedID := "test-hn-123"
	_, _ = db.Exec("INSERT INTO feed (id, user_id, url, refresh_interval) VALUES ($1, 'u1', 'https://feeds.thelocal.com/rss/es', 60000000000) ON CONFLICT DO NOTHING", feedID)

	feed := model.Feed{
		ID:              feedID,
		UserID:          "u1",
		URL:             "https://feeds.thelocal.com/rss/es",
		RefreshInterval: 10 * time.Minute,
	}

	slog.Info("Firing manual feed fetch...")
	svc.ProcessFeed(context.Background(), feed)
	slog.Info("Done. Check your database.")

}
