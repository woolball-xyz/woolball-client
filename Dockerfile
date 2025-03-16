FROM mcr.microsoft.com/playwright:v1.51.0-noble

WORKDIR /app

# Copy all source code first
COPY . .

# Install dependencies
# Using --ignore-scripts to prevent running the prepare script prematurely
RUN npm ci --ignore-scripts

# Now explicitly run the build steps in the correct order
RUN npm run build && npm run build:browser

# Command to run tests
CMD ["npm", "run", "test:e2e"]