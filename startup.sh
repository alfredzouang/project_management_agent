#!/bin/bash

# If USE_SUPERVISOR is set (Docker/production), run supervisord
if [[ "$USE_SUPERVISOR" == "1" ]]; then
  # Ensure logs directory exists
  mkdir -p /app/logs
  exec supervisord -c /app/supervisord.conf
else
  # Local development mode
  # Set PYTHONPATH for both src and backend/src (relative to project root)
  export PYTHONPATH="${PYTHONPATH}:$(pwd)/src:$(pwd)/backend/src"

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

  # Start API server in the background
  python backend/src/api.py &
  API_PID=$!

  # Change to frontend directory and start frontend dev server (runs in foreground)
  cd frontend

  # Install frontend dependencies if node_modules does not exist
  if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
  fi

  npm run dev

  # Optional: Uncomment the following line if you want to wait for all background processes to finish after npm run dev exits
  # wait $SOW_MCP_AGENT_PID $RESOURCE_MCP_PID $A2A_SERVER_PID $API_PID
fi
