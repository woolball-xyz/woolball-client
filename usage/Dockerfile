# Build stage
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Accept WebSocket URL as build argument (value comes from docker-compose or command line)
ARG VITE_WEBSOCKET_URL
ENV VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL:-ws://localhost:9003/ws}

RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy the built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 