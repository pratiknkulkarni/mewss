.PHONY: run build clean docker-up docker-down test

BINARY_NAME=feedscheduler

run:
	go run cmd/feedscheduler/main.go

build:
	go build -o bin/${BINARY_NAME} cmd/feedscheduler/main.go

test:
	go clean -testcache && go test -v ./...

clean:
	go clean
	rm -f bin/${BINARY_NAME}