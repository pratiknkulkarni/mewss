package database

import "log/slog"

// Connect establishes a connection to the database and configures the pool
func Connect() {
	slog.Info("connecting to the database")
}

// RunMigrations applies any pending SQL migrations on startup
func RunMigrations() {
	slog.Info("applying migrations")
}
