#!/bin/bash

# Integration Test Runner for NodeSH
# 
# Usage:
#   ./scripts/run-integration-tests.sh [test-pattern]
# 
# Examples:
#   ./scripts/run-integration-tests.sh
#   ./scripts/run-integration-tests.sh nextjs
#   ./scripts/run-integration-tests.sh autocomplete

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       NodeSH Integration Test Runner                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

# Function to cleanup Docker containers
cleanup() {
    echo ""
    echo -e "${YELLOW}Cleaning up...${NC}"
    cd "$PROJECT_ROOT"
    docker compose -f docker-compose.test.yml down --volumes --remove-orphans 2>/dev/null || true
}

# Check if containers are already running
CONTAINERS_RUNNING=$(docker compose -f "$PROJECT_ROOT/docker-compose.test.yml" ps -q 2>/dev/null | wc -l)

if [ "$CONTAINERS_RUNNING" -gt 0 ]; then
    echo -e "${GREEN}Test databases already running (${CONTAINERS_RUNNING} containers)${NC}"
    SKIP_CLEANUP=true
else
    SKIP_CLEANUP=false
    # Set trap to cleanup on exit
    trap cleanup EXIT
    
    # Start test databases
    echo -e "${YELLOW}Starting test databases...${NC}"
    cd "$PROJECT_ROOT"
    docker compose -f docker-compose.test.yml up -d
fi

# Wait for databases to be ready
echo -e "${YELLOW}Waiting for databases to be ready...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f docker-compose.test.yml ps | grep -q "healthy"; then
        break
    fi
    echo -n "."
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

echo ""

# Check if all services are healthy
HEALTHY_COUNT=$(docker compose -f docker-compose.test.yml ps | grep -c "healthy" || true)
if [ "$HEALTHY_COUNT" -lt 6 ]; then
    echo -e "${YELLOW}Warning: Not all databases are healthy yet, but continuing...${NC}"
fi

# Build the project first
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Run tests based on argument
TEST_PATTERN="${1:-}"

export ENABLE_INTEGRATION_TESTS=true

if [ -z "$TEST_PATTERN" ]; then
    echo -e "${GREEN}Running all integration tests...${NC}"
    npx jest tests/integration --verbose --runInBand --no-watchman --forceExit
elif [ "$TEST_PATTERN" == "nextjs" ]; then
    echo -e "${GREEN}Running Next.js integration tests...${NC}"
    npx jest tests/integration/nextjs --verbose --runInBand --no-watchman --forceExit
elif [ "$TEST_PATTERN" == "nestjs" ]; then
    echo -e "${GREEN}Running NestJS integration tests...${NC}"
    npx jest tests/integration/nestjs --verbose --runInBand --no-watchman --forceExit
elif [ "$TEST_PATTERN" == "express" ]; then
    echo -e "${GREEN}Running Express integration tests...${NC}"
    npx jest tests/integration/express --verbose --runInBand --no-watchman --forceExit
elif [ "$TEST_PATTERN" == "autocomplete" ]; then
    echo -e "${GREEN}Running autocomplete tests...${NC}"
    npx jest tests/integration/autocomplete --verbose --no-watchman --forceExit
else
    echo -e "${GREEN}Running tests matching: $TEST_PATTERN${NC}"
    npx jest tests/integration --verbose --runInBand --no-watchman --forceExit --testNamePattern="$TEST_PATTERN"
fi

echo ""
echo ""
if [ "$SKIP_CLEANUP" = true ]; then
    echo -e "${GREEN}✓ Integration tests completed (databases left running)${NC}"
else
    echo -e "${GREEN}✓ Integration tests completed${NC}"
fi
