.PHONY: run build clean docker-up docker-down

BINARY_NAME=feedscheduler

run:
	go run cmd/scheduler/main.go

build:
	go build -o bin/${BINARY_NAME} cmd/scheduler/main.go

clean:
	go clean
	rm -f bin/${BINARY_NAME}