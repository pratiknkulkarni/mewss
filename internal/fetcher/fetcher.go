package fetcher

import "github.com/mmcdole/gofeed"

type Fetcher interface {
	Fetch()
}
type GoFeedFetcher struct {
	parser *gofeed.Parser
}

func (f *GoFeedFetcher) Fetch() {
}
