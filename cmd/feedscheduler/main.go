package main

import (
	"feedscheduler/internal/config"
	"feedscheduler/internal/database"
	"feedscheduler/internal/logger"
	"log"
	"log/slog"
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

	database.Connect()
	database.RunMigrations()
}
