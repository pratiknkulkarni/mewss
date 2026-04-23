package fetcher

import (
	"context"
	"errors"
	"fmt"
	"net"
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
			Transport: &http.Transport{
				Proxy: http.ProxyFromEnvironment,
				DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
					host, port, err := net.SplitHostPort(addr)
					if err != nil {
						return nil, err
					}

					ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
					if err != nil {
						return nil, err
					}

					for _, ip := range ips {
						if ip.IP.IsPrivate() || ip.IP.IsLoopback() ||
							ip.IP.IsLinkLocalUnicast() || ip.IP.IsLinkLocalMulticast() ||
							ip.IP.IsUnspecified() {
							return nil, errors.New("unable to dial to private or loopback IPs")
						}
					}

					dialer := &net.Dialer{
						Timeout:   10 * time.Second,
						KeepAlive: 30 * time.Second,
					}
					return dialer.DialContext(ctx, network, net.JoinHostPort(ips[0].String(), port))
				},
				ForceAttemptHTTP2:     true,
				MaxIdleConns:          100,
				IdleConnTimeout:       90 * time.Second,
				TLSHandshakeTimeout:   10 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
			},
		},
		userAgent: userAgent,
		parser:    gofeed.NewParser(),
	}
}

func (f *GoFeedFetcher) Fetch(ctx context.Context, url string, etag *string, lastModified *string) (*FetchResult, error) {
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

	// adding a limit to 10 MB to prevent memory exhaustion from huge feeds as a safety net.
	resp.Body = http.MaxBytesReader(nil, resp.Body, 10*1024*1024)

	feed, err := f.parser.Parse(resp.Body)

	if err != nil {
		return nil, fmt.Errorf("failed to parse xml: %w", err)
	}

	for _, item := range feed.Items {
		item.Content = extractFeedContent(item)
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
