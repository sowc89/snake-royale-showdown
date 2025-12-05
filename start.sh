#!/bin/bash

# Function to handle script termination
cleanup() {
    echo "Stopping all servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

echo "🚀 Starting Snake Royale Showdown..."

# Start Backend
echo "🐍 Starting Backend (Port 8001)..."
cd backend
# Check if uv is installed, if not warn (assuming it is based on context)
uv run uvicorn app:app --reload --port 8001 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to initialize
sleep 2

# Start Frontend
echo "⚛️  Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers are running!"
echo "   Backend: http://127.0.0.1:8001"
echo "   Frontend: http://localhost:8080 (or port assigned by Vite)"
echo "Press Ctrl+C to stop both servers."

# Wait for processes to finish
wait $BACKEND_PID $FRONTEND_PID
