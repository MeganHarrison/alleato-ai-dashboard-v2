#!/bin/bash

echo "🚀 Starting Real FM Global RAG System..."
echo ""

# Check if Python agent directory exists
if [ ! -d "monorepo-agents/aisdk-rag-asrs/rag_agent_fm_global" ]; then
    echo "❌ Python RAG agent directory not found!"
    echo "Expected: monorepo-agents/aisdk-rag-asrs/rag_agent_fm_global/"
    exit 1
fi

# Navigate to Python agent directory
cd monorepo-agents/aisdk-rag-asrs/rag_agent_fm_global/

echo "📍 Working directory: $(pwd)"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating Python virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install additional dependencies for API server
pip install fastapi uvicorn python-multipart

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Starting RAG Agent API Server on http://localhost:8001"
echo "🔗 Next.js will connect via /api/fm-global-real-rag"
echo "📄 Access the advanced interface at: /fm-global-advanced"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the API server
python api_server.py