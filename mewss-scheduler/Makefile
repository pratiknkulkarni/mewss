-include .env
export

.PHONY: run build clean docker-up docker-down docker-down-clean test

BINARY_NAME=feedscheduler

run:
	go run cmd/feedscheduler/main.go

build:
	go build -o bin/${BINARY_NAME} cmd/feedscheduler/main.go

test:
	go clean -testcache && go test -v -race ./...

clean:
	go clean
	rm -f bin/${BINARY_NAME}

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-down-clean:
	docker compose down -v