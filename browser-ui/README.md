# Woolball Client UI

This is a React application for the Woolball Client UI, featuring WebSocket connectivity and HTTP API integration.

## Environment Variables

The application uses environment variables for configuration. These can be set in two ways:

### Development Mode

Create a `.env` file in the root directory with the following variables:

```
VITE_WEBSOCKET_URL=ws://localhost:9002/api/v1/ws
VITE_API_URL=http://localhost:9002/api/v1
```

### Docker Deployment

When deploying with Docker Compose, you can set the environment variables in the `docker-compose.yml` file:

```yaml
services:
  app:
    image: ghcr.io/woolball-xyz/client-node:latest
    environment:
      - VITE_WEBSOCKET_URL=ws://api.example.com/api/v1/ws
      - VITE_API_URL=https://api.example.com/api/v1
```

The application uses runtime configuration injection, so you can change the environment variables without rebuilding the Docker image.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Docker Build and Run

```bash
# Build the Docker image
docker-compose build

# Run the Docker container
docker-compose up -d
```

## Features

- WebSocket connection for real-time data
- HTTP API integration for file processing
- Runtime environment variable injection via Docker 