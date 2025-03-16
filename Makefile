.PHONY: build test clean

# Build the Docker image
build:
	docker-compose build

# Run the e2e tests in Docker
test: build
	docker-compose up

# Run the e2e tests in Docker and remove containers after
test-clean: build
	docker-compose up --abort-on-container-exit
	docker-compose down

# Clean up Docker resources
clean:
	docker-compose down
	rm -rf playwright-report test-results

# Run tests in CI mode (for GitHub Actions)
ci-test: build
	docker-compose up --abort-on-container-exit

# Help command
help:
	@echo "Available commands:"
	@echo "  make build      - Build the Docker image"
	@echo "  make test       - Run e2e tests in Docker"
	@echo "  make test-clean - Run tests and clean up containers"
	@echo "  make clean      - Remove containers and test reports"
	@echo "  make ci-test    - Run tests in CI mode"
	@echo "  make help       - Show this help message"