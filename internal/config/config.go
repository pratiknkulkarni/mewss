package config

import (
	"errors"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Config holds the configuration for the entire application
// TODO: think of a better docstring here and add in worker/scheduler "knobs" here
type Config struct {
	AppEnv            string        `mapstructure:"APP_ENV"`
	APIPort           string        `mapstructure:"API_PORT"`
	LogLevel          string        `mapstructure:"LOG_LEVEL"`
	DatabaseURL       string        `mapstructure:"DATABASE_URL"`
	TestDatabaseURL   string        `mapstructure:"TEST_DATABASE_URL"` // adding this, might delete later
	DBMaxOpenConns    int           `mapstructure:"DB_MAX_OPEN_CONNS"`
	DBMaxIdleConns    int           `mapstructure:"DB_MAX_IDLE_CONNS"`
	DBConnMaxLifetime time.Duration `mapstructure:"DB_CONN_MAX_LIFETIME"`
}

func LoadConfig() (*Config, error) {
	v := viper.New()

	v.SetDefault("APP_ENV", "development")
	v.SetDefault("API_PORT", ":8081")
	v.SetDefault("LOG_LEVEL", "info")
	v.SetDefault("DATABASE_URL", "")
	v.SetDefault("TEST_DATABASE_URL", "")

	// if the config.yaml exists, load from it instead
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")

	if err := v.ReadInConfig(); err != nil {
		// not panicking here since we can work with ENV variables.
		var configFileNotFoundError viper.ConfigFileNotFoundError
		if !errors.As(err, &configFileNotFoundError) {
			return nil, err
		}
	}

	v.SetEnvPrefix("RSS")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL configuration is required but missing")
	}

	if cfg.DBMaxOpenConns == 0 {
		cfg.DBMaxOpenConns = 25
	}

	if cfg.DBMaxIdleConns == 0 {
		cfg.DBMaxIdleConns = 25
	}

	if cfg.DBConnMaxLifetime == 0 {
		cfg.DBConnMaxLifetime = 5 * time.Minute
	}

	return &cfg, nil
}
