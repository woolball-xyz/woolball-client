# Build stage
FROM node:latest as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build com as variáveis de ambiente padrão
RUN npm run build

# Production stage with Nginx
FROM nginx:latest

# Copy the built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Use the entrypoint script to replace environment variables and start Nginx
ENTRYPOINT ["/docker-entrypoint.sh"] 