#!/bin/bash

set -e

# Check if NPM_TOKEN is set
if [ -z "$NPM_TOKEN" ]; then
  echo "❌ Error: NPM_TOKEN environment variable is not set"
  echo ""
  echo "Usage:"
  echo "  NPM_TOKEN=your_token_here ./publish.sh"
  echo ""
  echo "Or export it first:"
  echo "  export NPM_TOKEN=your_token_here"
  echo "  ./publish.sh"
  exit 1
fi

echo "📦 Building..."
npm run build

echo ""
echo "🧪 Running tests..."
npm test

echo ""
echo "🚀 Publishing to npm..."
npm publish --access public

echo ""
echo "✅ Published successfully!"
