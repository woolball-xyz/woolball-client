# Build stage
FROM node:latest AS builder

WORKDIR /app
COPY package*.json ./
# Replace local file: dependency with npm registry version for Docker build
RUN sed -i 's|"woolball-client": "file:.."|"woolball-client": "^0.1.50"|' package.json
RUN npm install
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:latest

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
