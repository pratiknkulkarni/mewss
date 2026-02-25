package fetcher

import (
	"context"
	"net/http"
	"time"

	"github.com/mmcdole/gofeed"
)

// userAgentTransport intercepts HTTP requests to add a User-Agent header.
// Since I can't directly update the gofeed.Parser's internal http.Request, I'll have to update the UA using RoundTrip
type userAgentTransport struct {
	rt        http.RoundTripper
	userAgent string
}

// RoundTrip executes a single HTTP transaction.
func (t *userAgentTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// clone and update that one as per docs
	// ref1 -> https://cs.opensource.google/go/go/+/refs/tags/go1.26.0:src/net/http/clientconn.go;l=246
	// ref2 -> https://groups.google.com/g/golang-nuts/c/-j6p12SSpXI?pli=1
	r2 := req.Clone(req.Context())
	r2.Header.Set("User-Agent", t.userAgent)
	return t.rt.RoundTrip(r2)
}

type Fetcher interface {
	Fetch(ctx context.Context, url string) (*gofeed.Feed, error)
}
type GoFeedFetcher struct {
	parser *gofeed.Parser
}

func NewGoFeedFetcher(timeout time.Duration, userAgent string) *GoFeedFetcher {
	fp := gofeed.NewParser()

	transport := &userAgentTransport{
		rt:        http.DefaultTransport,
		userAgent: userAgent,
	}

	client := &http.Client{
		Timeout:   timeout,
		Transport: transport,
	}

	fp.Client = client // forgot add this lol

	return &GoFeedFetcher{parser: fp}
}

func (f *GoFeedFetcher) Fetch(ctx context.Context, url string) (*gofeed.Feed, error) {
	return f.parser.ParseURLWithContext(url, ctx)
}
