package fetcher

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/mmcdole/gofeed"
)

// userAgentTransport intercepts HTTP requests to add a User-Agent header.
// Since I can't directly update the gofeed.Parser's internal http.Request, I'll have to update the UA using RoundTrip
//type userAgentTransport struct {
//	rt        http.RoundTripper
//	userAgent string
//}

// RoundTrip executes a single HTTP transaction.
//func (t *userAgentTransport) RoundTrip(req *http.Request) (*http.Response, error) {
//	// clone and update that one as per docs
//	// ref1 -> https://cs.opensource.google/go/go/+/refs/tags/go1.26.0:src/net/http/clientconn.go;l=246
//	// ref2 -> https://groups.google.com/g/golang-nuts/c/-j6p12SSpXI?pli=1
//	r2 := req.Clone(req.Context())
//	r2.Header.Set("User-Agent", t.userAgent)
//	return t.rt.RoundTrip(r2)
//}

type Fetcher interface {
	//Fetch(ctx context.Context, url string) (*gofeed.Feed, error)
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
	//fp := gofeed.NewParser()
	//
	//transport := &userAgentTransport{
	//	rt:        http.DefaultTransport,
	//	userAgent: userAgent,
	//}

	//client := &http.Client{
	//	Timeout:   timeout,
	//	Transport: transport,
	//}

	//fp.Client = client // forgot add this lol

	return &GoFeedFetcher{
		client: &http.Client{
			Timeout: timeout,
		},
		userAgent: userAgent,
		parser:    gofeed.NewParser(),
	}

	//return &GoFeedFetcher{parser: fp,
	//	userAgent: userAgent,
	//	parser:    gofeed.NewParser()}
}

func (f *GoFeedFetcher) Fetch(ctx context.Context, url string, etag *string, lastModified *string) (*FetchResult, error) {
	//return f.parser.ParseURLWithContext(url, ctx)
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
