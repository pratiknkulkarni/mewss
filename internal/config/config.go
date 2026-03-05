package config

import (
	"errors"
	"time"

	"github.com/spf13/viper"
)

// Config holds all runtime configuration for the application.
type Config struct {
	AppEnv            string        `mapstructure:"APP_ENV"`
	APIPort           string        `mapstructure:"API_PORT"`
	LogLevel          string        `mapstructure:"LOG_LEVEL"`
	DatabaseURL       string        `mapstructure:"DATABASE_URL"`
	DBMaxOpenConns    int           `mapstructure:"DB_MAX_OPEN_CONNS"`
	DBMaxIdleConns    int           `mapstructure:"DB_MAX_IDLE_CONNS"`
	DBConnMaxLifetime time.Duration `mapstructure:"DB_CONN_MAX_LIFETIME"`
	WorkerCount       int           `mapstructure:"WORKER_COUNT"`
	PollInterval      time.Duration `mapstructure:"POLL_INTERVAL"`
	StaleLockCutoff   time.Duration `mapstructure:"STALE_LOCK_CUTOFF"`
}

// LoadConfig reads configuration purely from environment variables.
// DATABASE_URL is the only required value — startup fails fast if absent.
func LoadConfig() (*Config, error) {
	v := viper.New()

	v.SetDefault("APP_ENV", "development")
	v.SetDefault("API_PORT", ":8081")
	v.SetDefault("LOG_LEVEL", "info")
	v.SetDefault("DB_MAX_OPEN_CONNS", 25)
	v.SetDefault("DB_MAX_IDLE_CONNS", 25)
	v.SetDefault("DB_CONN_MAX_LIFETIME", "5m")
	v.SetDefault("WORKER_COUNT", 5)
	v.SetDefault("POLL_INTERVAL", "10s")
	v.SetDefault("STALE_LOCK_CUTOFF", "15m")

	v.AutomaticEnv()

	cfg := &Config{
		AppEnv:            v.GetString("APP_ENV"),
		APIPort:           v.GetString("API_PORT"),
		LogLevel:          v.GetString("LOG_LEVEL"),
		DatabaseURL:       v.GetString("DATABASE_URL"),
		DBMaxOpenConns:    v.GetInt("DB_MAX_OPEN_CONNS"),
		DBMaxIdleConns:    v.GetInt("DB_MAX_IDLE_CONNS"),
		DBConnMaxLifetime: v.GetDuration("DB_CONN_MAX_LIFETIME"),
		WorkerCount:       v.GetInt("WORKER_COUNT"),
		PollInterval:      v.GetDuration("POLL_INTERVAL"),
		StaleLockCutoff:   v.GetDuration("STALE_LOCK_CUTOFF"),
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL environment variable is required but not set")
	}

	return cfg, nil
}
