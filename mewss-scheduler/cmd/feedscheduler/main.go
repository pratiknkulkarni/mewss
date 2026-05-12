package main

import (
	"context"
	"feedscheduler/internal/api"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"feedscheduler/internal/config"
	"feedscheduler/internal/database"
	"feedscheduler/internal/fetcher"
	"feedscheduler/internal/logger"
	"feedscheduler/internal/model"
	"feedscheduler/internal/repository"
	"feedscheduler/internal/service"
	"feedscheduler/internal/worker"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	logger.InitLogger(cfg.AppEnv, cfg.LogLevel)

	slog.Info("starting feed scheduler daemon", "version", "1.0.0", "env", cfg.AppEnv)

	db, err := database.Connect(cfg.DatabaseURL, cfg.DBMaxOpenConns, cfg.DBMaxIdleConns, cfg.DBConnMaxLifetime)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := database.RunMigrations(db); err != nil {
		slog.Error("failed to run database migrations", "error", err)
		os.Exit(1)
	}

	repo := repository.NewPostgresFeedRepository(db)
	netFetcher := fetcher.NewGoFeedFetcher(15*time.Second, "RSS-Scheduler/1.0", 10)
	feedService := service.NewFeedService(repo, netFetcher)

	//workerCount := 10
	jobsChan := make(chan model.Job, cfg.WorkerCount)

	pool := worker.NewPool(cfg.WorkerCount, feedService, jobsChan)
	scheduler := worker.NewScheduler(repo, jobsChan, cfg.PollInterval, cfg.StaleLockCutoff, cfg.WorkerCount)
	retentionCleaner := worker.NewRetentionCleaner(repo)

	validationFetcher := fetcher.NewGoFeedFetcher(15*time.Second, "RSS-Scheduler/1.0", 3)
	apiServer := api.NewServer(cfg.APIPort, validationFetcher, db, cfg.InternalApiSecret)

	ctx, cancel := context.WithCancel(context.Background())
	setupSignalHandler(cancel)

	go scheduler.Start(ctx)
	go retentionCleaner.Start(ctx)

	pool.Start(ctx)

	go func() {
		if err := apiServer.Start(); err != nil {
			slog.Error("http server crashed", "error", err)
		}
	}()

	<-ctx.Done()

	slog.Info("shutdown signal received, initiating graceful shutdown")

	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()
	if err := apiServer.Stop(shutdownCtx); err != nil {
		slog.Error("failed to stop http server gracefully", "error", err)
	}

	close(jobsChan)

	pool.Stop()

	slog.Info("graceful shutdown complete. exiting.")
}

// setupSignalHandler listens for OS interrupt signals and cancels the context.
func setupSignalHandler(cancel context.CancelFunc) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		oscall := <-c
		slog.Info("system call received", "signal", oscall)
		cancel()
	}()
}
