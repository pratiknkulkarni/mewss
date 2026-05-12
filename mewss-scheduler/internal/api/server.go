package api

import (
	"context"
	"crypto/subtle"
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
	httpServer        *http.Server
	fetcher           fetcher.Fetcher
	db                DBPinger
	internalApiSecret string
}

func (s *Server) requireInternalSecret(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// ref - https://cs.opensource.google/go/go/+/refs/tags/go1.26.3:src/crypto/internal/fips140/subtle/constant_time.go;l=13
		if subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Internal-Secret")), []byte(s.internalApiSecret)) != 1 {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		next(w, r)
	}
}

// NewServer initializes the HTTP API for internal cluster communication.
func NewServer(port string, feedFetcher fetcher.Fetcher, db DBPinger, internalApiSecret string) *Server {
	s := &Server{
		fetcher:           feedFetcher,
		db:                db,
		internalApiSecret: internalApiSecret,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /v1/health", s.handleHealthCheck)
	// mux.HandleFunc("POST /v1/feeds/validate", s.handleValidateFeed)
	mux.HandleFunc("POST /v1/feeds/validate", s.requireInternalSecret(s.handleValidateFeed))

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
