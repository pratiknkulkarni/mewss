package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"feedscheduler/internal/fetcher"

	"github.com/mmcdole/gofeed"
)

// ── mocks ─────────────────────────────────────────────────────────────────
// tests generated using Claude Sonnet 4.6

type mockPinger struct {
	err error
}

func (m *mockPinger) PingContext(_ context.Context) error {
	return m.err
}

type mockFetcher struct {
	result *fetcher.FetchResult
	err    error
}

func (m *mockFetcher) Fetch(_ context.Context, _ string, _ *string, _ *string) (*fetcher.FetchResult, error) {
	return m.result, m.err
}

// newTestServer builds a Server directly for handler tests.
// It skips ListenAndServe entirely — handlers are called directly.
func newTestServer(db DBPinger, f fetcher.Fetcher) *Server {
	return &Server{db: db, fetcher: f}
}

// decodeBody is a helper to decode JSON from a ResponseRecorder.
func decodeBody(t *testing.T, w *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.NewDecoder(w.Body).Decode(target); err != nil {
		t.Fatalf("failed to decode response body: %v\nbody was: %s", err, w.Body.String())
	}
}

// ── handleHealthCheck tests ───────────────────────────────────────────────

func TestHandleHealthCheck_DBUp_Returns200(t *testing.T) {
	s := newTestServer(&mockPinger{err: nil}, nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	w := httptest.NewRecorder()
	s.handleHealthCheck(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var body map[string]string
	decodeBody(t, w, &body)

	if body["status"] != "ok" {
		t.Errorf("expected status 'ok', got %q", body["status"])
	}
}

func TestHandleHealthCheck_DBDown_Returns503(t *testing.T) {
	s := newTestServer(&mockPinger{err: errors.New("connection refused")}, nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	w := httptest.NewRecorder()
	s.handleHealthCheck(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", w.Code)
	}

	var body map[string]string
	decodeBody(t, w, &body)

	if body["status"] != "unavailable" {
		t.Errorf("expected status 'unavailable', got %q", body["status"])
	}
	if body["reason"] == "" {
		t.Error("expected a reason field in 503 response")
	}
}

func TestHandleHealthCheck_ContentTypeIsJSON(t *testing.T) {
	s := newTestServer(&mockPinger{err: nil}, nil)

	req := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	w := httptest.NewRecorder()
	s.handleHealthCheck(w, req)

	ct := w.Header().Get("Content-Type")
	if !strings.HasPrefix(ct, "application/json") {
		t.Errorf("expected application/json Content-Type, got %q", ct)
	}
}

// ── handleValidateFeed tests ──────────────────────────────────────────────

func TestHandleValidateFeed_InvalidJSON_Returns400(t *testing.T) {
	s := newTestServer(nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/feeds/validate", strings.NewReader("not json"))
	w := httptest.NewRecorder()
	s.handleValidateFeed(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}

	var body map[string]string
	decodeBody(t, w, &body)
	if body["error"] == "" {
		t.Error("expected error field in response body")
	}
}

func TestHandleValidateFeed_EmptyURL_Returns400(t *testing.T) {
	s := newTestServer(nil, nil)

	payload := `{"url": ""}`
	req := httptest.NewRequest(http.MethodPost, "/v1/feeds/validate", strings.NewReader(payload))
	w := httptest.NewRecorder()
	s.handleValidateFeed(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}

	var body map[string]string
	decodeBody(t, w, &body)
	if !strings.Contains(body["error"], "url is required") {
		t.Errorf("expected 'url is required' error, got %q", body["error"])
	}
}

// TestHandleValidateFeed_Success_Returns200WithMeta verifies that a valid feed
// URL returns 200 with the feed title and description populated.
func TestHandleValidateFeed_Success_Returns200WithMeta(t *testing.T) {
	f := &mockFetcher{
		result: &fetcher.FetchResult{
			Feed: &gofeed.Feed{
				Title:       "Hacker News",
				Description: "Links for the intellectually curious",
			},
			NotModified: false,
		},
	}
	s := newTestServer(nil, f)

	payload := `{"url": "https://news.ycombinator.com/rss"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/feeds/validate", strings.NewReader(payload))
	w := httptest.NewRecorder()
	s.handleValidateFeed(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d — body: %s", w.Code, w.Body.String())
	}

	var body ValidateFeedResponse
	decodeBody(t, w, &body)

	if body.Status != "valid" {
		t.Errorf("expected status 'valid', got %q", body.Status)
	}
	if body.Title != "Hacker News" {
		t.Errorf("expected title 'Hacker News', got %q", body.Title)
	}
	if body.Description != "Links for the intellectually curious" {
		t.Errorf("expected description to match, got %q", body.Description)
	}
}

// TestHandleValidateFeed_MissingBody_Returns400 verifies behaviour when the
// request body is completely absent (nil reader).
func TestHandleValidateFeed_MissingBody_Returns400(t *testing.T) {
	s := newTestServer(nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/v1/feeds/validate", http.NoBody)
	w := httptest.NewRecorder()
	s.handleValidateFeed(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing body, got %d", w.Code)
	}
}

// TestHandleValidateFeed_ContentTypeIsJSON verifies every response sets the
// correct Content-Type regardless of outcome.
func TestHandleValidateFeed_ContentTypeIsJSON(t *testing.T) {
	cases := []struct {
		name    string
		payload string
	}{
		{"invalid json", "not json"},
		{"empty url", `{"url":""}`},
		{"valid request", `{"url":"https://example.com/rss"}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			f := &mockFetcher{
				result: &fetcher.FetchResult{Feed: &gofeed.Feed{Title: "Test"}},
			}
			s := newTestServer(nil, f)

			req := httptest.NewRequest(http.MethodPost, "/v1/feeds/validate", strings.NewReader(tc.payload))
			w := httptest.NewRecorder()
			s.handleValidateFeed(w, req)

			ct := w.Header().Get("Content-Type")
			if !strings.HasPrefix(ct, "application/json") {
				t.Errorf("expected application/json, got %q", ct)
			}
		})
	}
}
