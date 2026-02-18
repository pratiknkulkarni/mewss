.PHONY: run build clean docker-up docker-down

BINARY_NAME=feedscheduler

run:
	go run cmd/feedscheduler/main.go

build:
	go build -o bin/${BINARY_NAME} cmd/feedscheduler/main.go

clean:
	go clean
	rm -f bin/${BINARY_NAME}