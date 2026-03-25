package logger

import (
	"log/slog"
	"os"
	"strings"
)

// InitLogger initialises the logger based on the environment
func InitLogger(env string, levelStr string) {
	var handler slog.Handler
	var level slog.Level

	switch strings.ToLower(levelStr) {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level: level,
	}

	if strings.ToLower(env) == "production" || strings.ToLower(env) == "prod" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	logger := slog.New(handler)
	slog.SetDefault(logger)
}
