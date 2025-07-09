# Stage 1: Build frontend
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend and final image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y netcat supervisor && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Create logs directory
RUN mkdir -p /app/logs

# Copy backend code
COPY backend/ ./backend/
COPY requirements.txt ./

# Copy frontend build output to backend/src/static
COPY --from=frontend-build /app/frontend/dist ./backend/src/static

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy startup script and supervisord config
COPY startup.sh ./
COPY supervisord.conf ./
RUN chmod +x startup.sh

# Set environment variable to indicate production (supervisor) mode
ENV USE_SUPERVISOR=1

# Expose only the backend API port (serves both API and frontend)
EXPOSE 8000

# Entrypoint
ENTRYPOINT ["./startup.sh"]
