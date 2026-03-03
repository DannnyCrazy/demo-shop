#!/bin/bash

# Demo Shop - Development startup script

echo "🚀 Starting Demo Shop Development Environment"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
  echo "⚠️  backend/.env not found. Copy from .env.example"
  cp backend/.env.example backend/.env
fi

if [ ! -f "storefront/.env" ]; then
  echo "⚠️  storefront/.env not found. Copy from .env.example"
  cp storefront/.env.example storefront/.env
fi

if [ ! -f "admin/.env" ]; then
  echo "⚠️  admin/.env not found. Copy from .env.example"
  cp admin/.env.example admin/.env
fi

# Start all services in background
echo "Starting services..."
echo ""

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend starting on http://localhost:3000"
echo "   PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 3

# Start backend worker
npm run worker &
WORKER_PID=$!
echo "✅ Order worker started"
echo "   PID: $WORKER_PID"

# Start storefront
cd ../storefront
npm run dev &
STOREFRONT_PID=$!
echo "✅ Storefront starting on http://localhost:3001"
echo "   PID: $STOREFRONT_PID"

# Start admin
cd ../admin
npm run dev &
ADMIN_PID=$!
echo "✅ Admin starting on http://localhost:5173"
echo "   PID: $ADMIN_PID"

echo ""
echo "=========================================="
echo "🎉 All services started!"
echo "=========================================="
echo ""
echo "Services:"
echo "  Backend API:   http://localhost:3000"
echo "  Storefront:     http://localhost:3001"
echo "  Admin Panel:    http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to kill all background processes
cleanup() {
  echo ""
  echo "🛑 Stopping all services..."
  kill $BACKEND_PID 2>/dev/null
  kill $WORKER_PID 2>/dev/null
  kill $STOREFRONT_PID 2>/dev/null
  kill $ADMIN_PID 2>/dev/null
  echo "✅ All services stopped"
  exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for all background processes
wait
