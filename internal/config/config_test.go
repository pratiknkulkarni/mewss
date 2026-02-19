package config

import (
	"os"
	"strings"
	"testing"
)

func TestLoadConfig_ValidationFails(t *testing.T) {
	os.Unsetenv("RSS_DATABASE_URL")

	_, err := LoadConfig()
	if err == nil {
		t.Fatal("expected an error when DATABASE_URL is missing, got nil")
	}

	expectedErr := "DATABASE_URL configuration is required"
	if !strings.Contains(err.Error(), expectedErr) {
		t.Errorf("expected error to contain %q, got %q", expectedErr, err.Error())
	}
}

func TestLoadConfig_EnvOverrides(t *testing.T) {
	os.Setenv("RSS_DATABASE_URL", "postgres://test:test@localhost:5432/testdb")
	os.Setenv("RSS_WORKER_COUNT", "99")
	os.Setenv("RSS_APP_ENV", "testing")

	defer os.Unsetenv("RSS_DATABASE_URL")
	defer os.Unsetenv("RSS_WORKER_COUNT")
	defer os.Unsetenv("RSS_APP_ENV")

	cfg, err := LoadConfig()

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.DatabaseURL != "postgres://test:test@localhost:5432/testdb" {
		t.Errorf("expected DB URL from env, got %v", cfg.DatabaseURL)
	}

	if cfg.AppEnv != "testing" {
		t.Errorf("expected AppEnv 'testing', got %v", cfg.AppEnv)
	}
}
