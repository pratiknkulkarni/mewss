package fetcher

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/microcosm-cc/bluemonday"
	"github.com/mmcdole/gofeed"
)

type Fetcher interface {
	Fetch(ctx context.Context, url string, etag *string, lastModified *string) (*FetchResult, error)
}

type FetchResult struct {
	Feed         *gofeed.Feed
	Etag         *string
	LastModified *string
	NotModified  bool
}

type GoFeedFetcher struct {
	client    *http.Client
	userAgent string
	parser    *gofeed.Parser
}

func NewGoFeedFetcher(timeout time.Duration, userAgent string) *GoFeedFetcher {
	return &GoFeedFetcher{
		client: &http.Client{
			Timeout: timeout,
		},
		userAgent: userAgent,
		parser:    gofeed.NewParser(),
	}
}

func (f *GoFeedFetcher) Fetch(ctx context.Context, url string, etag *string, lastModified *string) (*FetchResult, error) {
	//fmt.Println("inside the fetcher")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", f.userAgent)

	if etag != nil && *etag != "" {
		req.Header.Set("If-None-Match", *etag)
	}
	if lastModified != nil && *lastModified != "" {
		req.Header.Set("If-Modified-Since", *lastModified)
	}

	resp, err := f.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("network request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotModified {
		return &FetchResult{NotModified: true}, nil
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("http error: %d %s", resp.StatusCode, resp.Status)
	}

	feed, err := f.parser.Parse(resp.Body)

	for _, item := range feed.Items {
		item.Content = extractFeedContent(item)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to parse xml: %w", err)
	}

	var newEtag, newLM *string
	if e := resp.Header.Get("Etag"); e != "" {
		newEtag = &e
	}
	if lm := resp.Header.Get("Last-Modified"); lm != "" {
		newLM = &lm
	}

	return &FetchResult{
		Feed:         feed,
		Etag:         newEtag,
		LastModified: newLM,
		NotModified:  false,
	}, nil
}

var sanitizer = bluemonday.UGCPolicy()

// extractFeedContent extracts
func extractFeedContent(item *gofeed.Item) string {
	var raw string

	if strings.TrimSpace(item.Content) != "" {
		raw = item.Content
	} else if strings.TrimSpace(item.Description) != "" {
		raw = item.Description
	}

	if raw == "" {
		return ""
	}

	return sanitizer.Sanitize(raw)
}
