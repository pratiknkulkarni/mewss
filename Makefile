.PHONY: check check-api check-scheduler up down down-clean dev-postgres

check: check-scheduler check-api
	@echo ""
	@echo "all checks passed"

check-scheduler:
	@echo "==> scheduler: tests"
	cd mewss-scheduler && go test -v -race ./...

check-api:
 	@echo "==> api: typecheck"
	cd mewss-api && bun run tsc --noEmit
	@echo "==> api: unit tests"
	cd mewss-api && bun run test                
	@echo "==> api: integration tests"
	cd mewss-api && bun run test:integration


dev-postgres:
	docker compose up postgres -d

up:
	docker compose up --build

down:
	docker compose down

down-clean:
	docker compose down -v
