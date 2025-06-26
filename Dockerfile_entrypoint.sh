#!/bin/bash

set -e

# Set PYTHONPATH for both src and backend/src (relative to /app)
export PYTHONPATH="${PYTHONPATH}:/app/src:/app/backend/src"

# Helper function to wait for a port to be open
wait_for_port() {
  local port=$1
  local name=$2
  echo "Waiting for $name to be ready on port $port..."
  while ! nc -z localhost $port; do
    sleep 1
  done
  echo "$name is ready on port $port."
}

# Start backend services in the background
python backend/src/plugins/mcp/sow_mcp_agent.py --transport sse --port 9999 &
SOW_MCP_AGENT_PID=$!

python backend/src/plugins/mcp/resource_mcp.py &
RESOURCE_MCP_PID=$!

python backend/src/a2a_server.py &
A2A_SERVER_PID=$!

# Wait for all backend services to be ready
wait_for_port 9999 "sow_mcp_agent"
wait_for_port 9001 "resource_mcp"
wait_for_port 9002 "a2a_server"

# Start API server in the foreground (serves both API and frontend)
exec python backend/src/api.py
