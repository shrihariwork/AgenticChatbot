#!/bin/bash

echo "🏗️  Starting Premium Real Estate Chatbot..."
echo "📍 Location: Bangalore, India"
echo "🤖 AI-Powered Real Estate Assistant"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create logs directory if it doesn't exist
mkdir -p logs

echo "🚀 Starting server..."
echo "🌐 Web Interface: http://localhost:3000"
echo "🔌 API Endpoint: http://localhost:3000/api"
echo "💚 Health Check: http://localhost:3000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start 