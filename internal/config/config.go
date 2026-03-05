package config

import (
	"errors"
	"time"

	"github.com/spf13/viper"
)

// Config holds all runtime configuration for the application.
// Every field maps directly to an environment variable of the same name
// (e.g. DATABASE_URL, WORKER_COUNT). No prefix, no config file.
//
// For local development without Docker, copy .env.example to .env
// and run via `make run` (the Makefile loads .env automatically).
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
// All other fields have sensible defaults and are optional.
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

	// AutomaticEnv maps every v.Get* call to the matching environment variable.
	// We intentionally do NOT call v.Unmarshal here — in Viper v1.21 Unmarshal
	// builds its input from AllSettings() which does not reliably include values
	// that come purely from environment variables, causing fields like
	// DATABASE_URL to silently unmarshal as empty strings even when the env var
	// is set. Using v.Get* methods directly bypasses this and works correctly.
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

//package config
//
//import (
//	"errors"
//	"time"
//
//	"github.com/spf13/viper"
//)
//
//// Config holds all runtime configuration for the application.
//type Config struct {
//	AppEnv            string        `mapstructure:"APP_ENV"`
//	APIPort           string        `mapstructure:"API_PORT"`
//	LogLevel          string        `mapstructure:"LOG_LEVEL"`
//	DatabaseURL       string        `mapstructure:"DATABASE_URL"`
//	DBMaxOpenConns    int           `mapstructure:"DB_MAX_OPEN_CONNS"`
//	DBMaxIdleConns    int           `mapstructure:"DB_MAX_IDLE_CONNS"`
//	DBConnMaxLifetime time.Duration `mapstructure:"DB_CONN_MAX_LIFETIME"`
//	WorkerCount       int           `mapstructure:"WORKER_COUNT"`
//	PollInterval      time.Duration `mapstructure:"POLL_INTERVAL"`
//	StaleLockCutoff   time.Duration `mapstructure:"STALE_LOCK_CUTOFF"`
//}
//
//// LoadConfig reads configuration purely from environment variables.
//func LoadConfig() (*Config, error) {
//	v := viper.New()
//
//	v.SetDefault("APP_ENV", "development")
//	v.SetDefault("API_PORT", ":8081")
//	v.SetDefault("LOG_LEVEL", "info")
//	v.SetDefault("DATABASE_URL", "")
//	v.SetDefault("WORKER_COUNT", 5)
//	v.SetDefault("POLL_INTERVAL", "10s")
//	v.SetDefault("STALE_LOCK_CUTOFF", "15m")
//	v.SetDefault("DB_MAX_OPEN_CONNS", 25)
//	v.SetDefault("DB_CONN_MAX_LIFETIME", "5m")
//	v.SetDefault("DB_MAX_IDLE_CONNS", 25)
//
//	v.AutomaticEnv()
//
//	if err := v.ReadInConfig(); err != nil {
//		var configFileNotFoundError viper.ConfigFileNotFoundError
//		if !errors.As(err, &configFileNotFoundError) {
//			return nil, err
//		}
//	}
//
//	for _, key := range []string{
//		"APP_ENV", "API_PORT", "LOG_LEVEL", "DATABASE_URL",
//		"DB_MAX_OPEN_CONNS", "DB_MAX_IDLE_CONNS", "DB_CONN_MAX_LIFETIME",
//		"WORKER_COUNT", "POLL_INTERVAL", "STALE_LOCK_CUTOFF",
//	} {
//		if err := v.BindEnv(key); err != nil {
//			return nil, err
//		}
//	}
//
//	var cfg Config
//	if err := v.Unmarshal(&cfg); err != nil {
//		return nil, err
//	}
//
//	if cfg.DatabaseURL == "" {
//		return nil, errors.New("DATABASE_URL configuration is required but missing")
//	}
//
//	return &cfg, nil
//}
