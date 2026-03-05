package database

import (
	"database/sql"
	"embed"
	"errors"
	"log/slog"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/lib/pq"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

// Connect establishes a connection to the database and configures the pool
func Connect(dbURL string, maxOpen, maxIdle int, maxLifetime time.Duration) (*sql.DB, error) {
	slog.Info("connecting to the database")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(maxOpen)
	db.SetMaxIdleConns(maxIdle)
	db.SetConnMaxLifetime(maxLifetime) // remove time.Minute

	slog.Info("connected to postgres database")
	return db, nil
}

// RunMigrations applies any pending SQL migrations on startup
func RunMigrations(db *sql.DB) error {
	slog.Info("checking database migrations")

	source, err := iofs.New(migrationFS, "migrations")
	if err != nil {
		return err
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return err
	}
	//m, err := migrate.NewWithDatabaseInstance("file://migrations", "postgres", driver)
	m, err := migrate.NewWithInstance("iofs", source, "postgres", driver)
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
