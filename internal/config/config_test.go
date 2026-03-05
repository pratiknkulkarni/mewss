package config

import (
	"strings"
	"testing"
	"time"
)

// TestLoadConfig_MissingDatabaseURL verifies that startup fails immediately
// with a clear message when DATABASE_URL is not set.
func TestLoadConfig_MissingDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "")

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("expected an error when DATABASE_URL is missing, got nil")
	}

	if !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Errorf("unexpected error message: %q", err.Error())
	}
}

// TestLoadConfig_ReadsFromEnv verifies that all fields are populated
// correctly from environment variables.
func TestLoadConfig_ReadsFromEnv(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://test:test@localhost:5432/testdb")
	t.Setenv("WORKER_COUNT", "99")
	t.Setenv("APP_ENV", "testing")
	t.Setenv("LOG_LEVEL", "debug")
	t.Setenv("API_PORT", ":9090")

	cfg, err := LoadConfig()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.DatabaseURL != "postgres://test:test@localhost:5432/testdb" {
		t.Errorf("DatabaseURL: got %q", cfg.DatabaseURL)
	}
	if cfg.WorkerCount != 99 {
		t.Errorf("WorkerCount: expected 99, got %d", cfg.WorkerCount)
	}
	if cfg.AppEnv != "testing" {
		t.Errorf("AppEnv: expected %q, got %q", "testing", cfg.AppEnv)
	}
	if cfg.LogLevel != "debug" {
		t.Errorf("LogLevel: expected %q, got %q", "debug", cfg.LogLevel)
	}
	if cfg.APIPort != ":9090" {
		t.Errorf("APIPort: expected %q, got %q", ":9090", cfg.APIPort)
	}
}

// TestLoadConfig_Defaults verifies that sensible defaults are applied for
// every optional field when only the required DATABASE_URL is set.
func TestLoadConfig_Defaults(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://test:test@localhost:5432/testdb")

	cfg, err := LoadConfig()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.AppEnv != "development" {
		t.Errorf("AppEnv default: expected %q, got %q", "development", cfg.AppEnv)
	}
	if cfg.APIPort != ":8081" {
		t.Errorf("APIPort default: expected %q, got %q", ":8081", cfg.APIPort)
	}
	if cfg.WorkerCount != 5 {
		t.Errorf("WorkerCount default: expected 5, got %d", cfg.WorkerCount)
	}
	if cfg.DBMaxOpenConns != 25 {
		t.Errorf("DBMaxOpenConns default: expected 25, got %d", cfg.DBMaxOpenConns)
	}

	expectedDBConnMaxLifetime := time.Duration(5 * time.Minute)

	if cfg.DBConnMaxLifetime != expectedDBConnMaxLifetime {
		t.Errorf("DBMaxIdleConns default: expected 25, got %d", cfg.DBMaxOpenConns)
	}
}
