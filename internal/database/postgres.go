package database

import (
	"database/sql"
	"errors"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

// Connect establishes a connection to the database and configures the pool
func Connect(dbURL string) (*sql.DB, error) {
	slog.Info("connecting to the database")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	//TODO: tune parameters here

	slog.Info("connected to postgres database")
	return db, nil
	//return nil, nil
}

// RunMigrations applies any pending SQL migrations on startup
func RunMigrations(db *sql.DB) error {
	slog.Info("checking database migrations")
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return err
	}
	m, err := migrate.NewWithDatabaseInstance("file://migrations", "postgres", driver)
	if err != nil {
		return err
	}

	err = m.Up()
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			slog.Info("database schema is up to date")
			return nil
		}
		return err
	}

	slog.Info("database migrations applied successfully")
	return nil
}
