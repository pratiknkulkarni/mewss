package config

import (
	"strings"

	"github.com/spf13/viper"
)

// Config holds the configuration for the entire application
// TODO: think of a better docstring here and add in worker/scheduler "knobs" here
type Config struct {
	AppEnv  string `mapstructure:"APP_ENV"`
	APIPort string `mapstructure:"API_PORT"`
}

func LoadConfig() (*Config, error) {
	v := viper.New()

	v.SetDefault("APP_ENV", "development")
	v.SetDefault("API_PORT", ":8081")

	// if the config.yaml exists, load from it instead
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")

	if err := v.ReadInConfig(); err != nil {
		// not panicking here since we can work with ENV variables.
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
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

	return &cfg, nil
}
