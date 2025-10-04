#!/bin/bash

# GLIN SDK Publishing Script
# Publishes both @glin-ai/sdk packages to npm registry

set -e  # Exit on any error

echo "============================================"
echo "🚀 GLIN SDK Publishing Script"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if logged into npm
echo "📝 Checking npm authentication..."
if ! npm whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Not logged into npm. Please run: npm login${NC}"
    exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✅ Logged in as: ${NPM_USER}${NC}"
echo ""

# Step 1: Publish JS package
echo "============================================"
echo "📦 Step 1: Publishing @glin-ai/sdk"
echo "============================================"
cd packages/js

echo "Package details:"
npm pack --dry-run | grep "package size" | head -1

echo ""
echo -e "${BLUE}Publishing @glin-ai/sdk@0.3.0...${NC}"
npm publish --access public

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ @glin-ai/sdk@0.3.0 published successfully!${NC}"
else
    echo -e "${RED}❌ Failed to publish @glin-ai/sdk${NC}"
    exit 1
fi

echo ""
echo "Waiting 5 seconds for npm registry to update..."
sleep 5

# Step 2: Publish React package
echo ""
echo "============================================"
echo "📦 Step 2: Publishing @glin-ai/sdk-react"
echo "============================================"
cd ../react

echo "Package details:"
npm pack --dry-run | grep "package size" | head -1

echo ""
echo -e "${BLUE}Publishing @glin-ai/sdk-react@0.1.0...${NC}"
npm publish --access public

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ @glin-ai/sdk-react@0.1.0 published successfully!${NC}"
else
    echo -e "${RED}❌ Failed to publish @glin-ai/sdk-react${NC}"
    exit 1
fi

# Success!
echo ""
echo "============================================"
echo "🎉 SUCCESS! Both packages published!"
echo "============================================"
echo ""
echo "Published packages:"
echo "  📦 @glin-ai/sdk@0.3.0"
echo "  📦 @glin-ai/sdk-react@0.1.0"
echo ""
echo "View on npm:"
echo "  🔗 https://www.npmjs.com/package/@glin-ai/sdk"
echo "  🔗 https://www.npmjs.com/package/@glin-ai/sdk-react"
echo ""
echo "Next steps:"
echo "  1. Verify packages on npmjs.com"
echo "  2. Update apps to use published versions"
echo ""
