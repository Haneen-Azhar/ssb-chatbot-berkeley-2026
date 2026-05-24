#!/bin/bash

# SSB Chatbot Startup Script
# Starts both backend and frontend servers

echo "🚀 Starting SSB Chatbot..."

# Kill any existing instances
echo "Cleaning up old instances..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:8765 | xargs kill -9 2>/dev/null

# Start backend
echo "📚 Starting backend (port 3001)..."
cd "team B bot/backend" && npm start > /tmp/ssb-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start frontend
echo "🌐 Starting frontend (port 8765)..."
cd "../Berkeley-Portal-Reconstruction" && python3 -m http.server 8765 > /tmp/ssb-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for servers to start
sleep 2

echo ""
echo "✅ SSB Chatbot is running!"
echo ""
echo "🌐 Frontend: http://localhost:8765/"
echo "🔌 Backend:  http://localhost:3001/"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/ssb-backend.log"
echo "   Frontend: tail -f /tmp/ssb-frontend.log"
echo ""
echo "🛑 To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "   Or run: lsof -ti:3001,8765 | xargs kill -9"
echo ""

# Keep script running
wait
