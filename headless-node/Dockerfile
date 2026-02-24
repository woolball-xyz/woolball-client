# Stage 1: Build browser-ui
FROM node:22-slim AS ui-builder

WORKDIR /app
COPY browser-ui/package*.json ./browser-ui/
# Replace local file: dependency with npm registry version
RUN sed -i 's|"woolball-client": "file:.."|"woolball-client": "^0.1.50"|' browser-ui/package.json
RUN cd browser-ui && npm install
COPY browser-ui/ ./browser-ui/
RUN cd browser-ui && npm run build

# Stage 2: Headless node
FROM node:22-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install Node dependencies
COPY headless-node/package*.json ./
RUN npm install

# Copy the start script
COPY headless-node/start.mjs ./

# Copy built browser-ui
COPY --from=ui-builder /app/browser-ui/dist /app/browser-ui

ENV STATIC_DIR=/app/browser-ui
ENV NODE_COUNT=1
ENV VITE_WEBSOCKET_URL=ws://host.docker.internal:9003/ws

CMD ["node", "start.mjs"]
