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
COPY package*.json ./
RUN npm install

# Copy the start script
COPY start.mjs ./

# Copy pre-built browser-ui (build it locally first with: cd browser-ui && npm run build)
COPY browser-ui-dist /app/browser-ui

ENV STATIC_DIR=/app/browser-ui
ENV NODE_COUNT=1
ENV VITE_WEBSOCKET_URL=ws://host.docker.internal:9003/ws

CMD ["node", "start.mjs"]
