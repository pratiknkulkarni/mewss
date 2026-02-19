package main

import (
	"feedscheduler/internal/config"
	"feedscheduler/internal/database"
	"feedscheduler/internal/logger"
	"log"
	"log/slog"
	"os"
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

	dbURL := os.Getenv("RSS_DATABASE_URL")
	db, err := database.Connect(dbURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	defer db.Close()

	if err := database.RunMigrations(db); err != nil {
		slog.Error("failed to run database migrations", "error", err)
		os.Exit(1)
	}
}
