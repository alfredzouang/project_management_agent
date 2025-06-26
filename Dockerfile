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
RUN apt-get update && apt-get install -y netcat && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy backend code
COPY backend/ ./backend/
COPY requirements.txt ./

# Copy frontend build output to backend/src/static
COPY --from=frontend-build /app/frontend/dist ./backend/src/static

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy startup and entrypoint scripts
COPY startup.sh ./
COPY Dockerfile_entrypoint.sh ./entrypoint.sh
RUN chmod +x startup.sh entrypoint.sh

# Expose only the backend API port (serves both API and frontend)
EXPOSE 8000

# Entrypoint
ENTRYPOINT ["./entrypoint.sh"]
