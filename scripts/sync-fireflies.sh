#!/bin/bash

# Enhanced Fireflies Sync Runner
# This script makes it easy to run the Fireflies sync with proper environment variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Enhanced Fireflies Sync Runner${NC}\n"

# Check for .env.local file
if [ -f "$PROJECT_DIR/.env.local" ]; then
    echo -e "${GREEN}✓${NC} Found .env.local file"
    # Source the env file (basic parsing)
    export $(grep -v '^#' "$PROJECT_DIR/.env.local" | xargs)
else
    echo -e "${YELLOW}⚠${NC}  No .env.local file found"
fi

# Parse command line arguments
ACTION=${1:-sync}
LIMIT=${2:-50}
DRY_RUN=${3:-false}

# Display current configuration
echo -e "\n${BLUE}Configuration:${NC}"
echo "  Action: $ACTION"
echo "  Limit: $LIMIT"
echo "  Dry Run: $DRY_RUN"

# Check required environment variables
MISSING_VARS=()

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
    MISSING_VARS+=("SUPABASE_URL")
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && [ -z "$SUPABASE_SERVICE_KEY" ]; then
    MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if [ -z "$FIREFLIES_API_KEY" ]; then
    MISSING_VARS+=("FIREFLIES_API_KEY")
fi

# If missing variables, prompt for them
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}Missing environment variables. Please provide:${NC}"
    
    for VAR in "${MISSING_VARS[@]}"; do
        echo -n "  $VAR: "
        read -s VALUE
        echo ""
        export $VAR="$VALUE"
    done
fi

# Export variables with proper names for the script
export SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_SERVICE_KEY}"

# Run the appropriate action
case $ACTION in
    check)
        echo -e "\n${BLUE}Checking meetings table structure...${NC}\n"
        node "$SCRIPT_DIR/check-meetings-table.js"
        ;;
    
    sync)
        echo -e "\n${BLUE}Starting Fireflies sync...${NC}\n"
        node "$SCRIPT_DIR/enhanced-fireflies-sync.js" \
            --limit="$LIMIT" \
            --dry-run="$DRY_RUN"
        ;;
    
    dry-run)
        echo -e "\n${BLUE}Starting Fireflies sync (DRY RUN)...${NC}\n"
        node "$SCRIPT_DIR/enhanced-fireflies-sync.js" \
            --limit="$LIMIT" \
            --dry-run="true"
        ;;
    
    help)
        echo -e "\n${GREEN}Usage:${NC}"
        echo "  ./sync-fireflies.sh [action] [limit] [dry-run]"
        echo ""
        echo -e "${GREEN}Actions:${NC}"
        echo "  check    - Check meetings table structure"
        echo "  sync     - Sync transcripts (default)"
        echo "  dry-run  - Run sync in dry-run mode"
        echo "  help     - Show this help message"
        echo ""
        echo -e "${GREEN}Examples:${NC}"
        echo "  ./sync-fireflies.sh check"
        echo "  ./sync-fireflies.sh sync 20"
        echo "  ./sync-fireflies.sh dry-run 10"
        echo ""
        echo -e "${GREEN}Environment Variables:${NC}"
        echo "  SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL"
        echo "  SUPABASE_SERVICE_ROLE_KEY"
        echo "  FIREFLIES_API_KEY"
        ;;
    
    *)
        echo -e "${RED}Unknown action: $ACTION${NC}"
        echo "Run './sync-fireflies.sh help' for usage information"
        exit 1
        ;;
esac