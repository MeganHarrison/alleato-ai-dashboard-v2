#!/bin/bash

# Start development server with correct OPENAI_API_KEY from .env file
# This ensures the cached system key is not used

echo "Starting Alleato AI Dashboard..."
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
    # Extract OPENAI_API_KEY from .env file
    OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d '=' -f2-)
    
    if [ -n "$OPENAI_KEY" ]; then
        echo "✓ Using OPENAI_API_KEY from .env file"
        echo "  Key starts with: $(echo $OPENAI_KEY | cut -c1-20)..."
        export OPENAI_API_KEY="$OPENAI_KEY"
    else
        echo "⚠️  Warning: OPENAI_API_KEY not found in .env file"
    fi
else
    echo "⚠️  Warning: .env file not found"
fi

echo ""
echo "Starting Next.js development server..."
echo "=================================="
echo ""

# Start the development server
npm run dev