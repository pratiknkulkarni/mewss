package api

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

func (s *Server) handleHealthCheck(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := s.db.PingContext(ctx); err != nil {
		slog.Warn("health check failed: database unreachable", "error", err)
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "unavailable",
			"reason": "database unreachable",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type ValidateFeedRequest struct {
	URL string `json:"url"`
}

type ValidateFeedResponse struct {
	Status      string `json:"status"`
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
}

// handleValidateFeed is called by API BEFORE inserting a feed into Postgres.
// It is a "shield" to prevent garbage URLs from entering the database queue.
func (s *Server) handleValidateFeed(w http.ResponseWriter, r *http.Request) {
	var req ValidateFeedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json payload")
		return
	}

	if req.URL == "" {
		writeError(w, http.StatusBadRequest, "url is required")
		return
	}

	fetchCtx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	parsedFeed, err := s.fetcher.Fetch(fetchCtx, req.URL, nil, nil)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid rss feed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, ValidateFeedResponse{
		Status:      "valid",
		Title:       parsedFeed.Feed.Title,
		Description: parsedFeed.Feed.Description,
	})
}
