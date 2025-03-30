#!/bin/bash

# Script to start the waste detection API server
# Usage: ./start_api_server.sh [port]

# Default values
PORT=${1:-"8001"}  # Default port

echo "Starting Waste Detection API server on port $PORT"

# Kill any existing instances
pkill -f "uvicorn main:app"

# Start the server in the background
cd detection_api && uvicorn main:app --reload --port $PORT

echo "API server stopped" 