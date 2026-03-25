package api

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"feedscheduler/internal/fetcher"
)

type DBPinger interface {
	PingContext(ctx context.Context) error
}

type Server struct {
	httpServer *http.Server
	fetcher    fetcher.Fetcher
	db         DBPinger
}

// NewServer initializes the HTTP API for internal cluster communication.
func NewServer(port string, feedFetcher fetcher.Fetcher, db DBPinger) *Server {
	s := &Server{
		fetcher: feedFetcher,
		db:      db,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /v1/health", s.handleHealthCheck)
	mux.HandleFunc("POST /v1/feeds/validate", s.handleValidateFeed)

	s.httpServer = &http.Server{
		Addr:         port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	return s
}

func (s *Server) Start() error {
	slog.Info("starting internal http api", "port", s.httpServer.Addr)
	if err := s.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

func (s *Server) Stop(ctx context.Context) error {
	slog.Info("shutting down internal http api...")
	return s.httpServer.Shutdown(ctx)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("failed to write json response", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
