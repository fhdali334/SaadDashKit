#!/bin/bash

# BigCommerce API Test Script using curl
# This script tests the BigCommerce API endpoint directly using curl

# Configuration - Replace these with your actual values
STORE_HASH="${BIGCOMMERCE_STORE_HASH:-your-store-hash}"
ACCESS_TOKEN="${BIGCOMMERCE_ACCESS_TOKEN:-your-access-token}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing BigCommerce API with curl...${NC}"
echo ""

# Check if credentials are provided
if [ "$STORE_HASH" = "your-store-hash" ] || [ "$ACCESS_TOKEN" = "your-access-token" ]; then
    echo -e "${RED}Error: Please provide your BigCommerce credentials${NC}"
    echo ""
    echo "Usage:"
    echo "  export BIGCOMMERCE_STORE_HASH='your-store-hash'"
    echo "  export BIGCOMMERCE_ACCESS_TOKEN='your-access-token'"
    echo "  ./test-bigcommerce-curl.sh"
    echo ""
    echo "Or edit the script and set STORE_HASH and ACCESS_TOKEN directly"
    exit 1
fi

# Build the API URL
API_URL="https://api.bigcommerce.com/stores/${STORE_HASH}/v3/catalog/products?page=1&limit=10"

echo -e "${YELLOW}Request Details:${NC}"
echo "  URL: $API_URL"
echo "  Method: GET"
echo "  Headers:"
echo "    X-Auth-Token: ${ACCESS_TOKEN:0:10}... (hidden)"
echo "    Accept: application/json"
echo ""

# Make the curl request
echo -e "${YELLOW}Making request...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET \
    -H "Accept: application/json" \
    -H "X-Auth-Token: ${ACCESS_TOKEN}" \
    "${API_URL}")

# Split response and HTTP status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo -e "${YELLOW}Response Status:${NC} $HTTP_CODE"
echo ""

# Check HTTP status code
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Success!${NC}"
    echo ""
    echo -e "${YELLOW}Response Body (first 1000 chars):${NC}"
    echo "$HTTP_BODY" | head -c 1000
    echo ""
    echo ""
    
    # Try to parse JSON and show product count
    PRODUCT_COUNT=$(echo "$HTTP_BODY" | grep -o '"data":\[' | wc -l || echo "0")
    if command -v jq &> /dev/null; then
        echo -e "${YELLOW}Parsed Response:${NC}"
        echo "$HTTP_BODY" | jq '.meta.pagination // "No pagination info"' 2>/dev/null || echo "Could not parse JSON"
        echo ""
        PRODUCT_COUNT=$(echo "$HTTP_BODY" | jq '.data | length' 2>/dev/null || echo "0")
        echo -e "${GREEN}Products returned: $PRODUCT_COUNT${NC}"
    fi
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}✗ Unauthorized (401)${NC}"
    echo "  Check your ACCESS_TOKEN"
    echo ""
    echo "$HTTP_BODY"
elif [ "$HTTP_CODE" -eq 403 ]; then
    echo -e "${RED}✗ Forbidden (403)${NC}"
    echo "  Your API token may not have the required scopes"
    echo "  Required scopes:"
    echo "    - store_v2_products_read_only (Products read-only)"
    echo "    - store_v2_inventory_read_only (Store Inventory read-only) - may be required"
    echo ""
    echo "$HTTP_BODY"
elif [ "$HTTP_CODE" -eq 404 ]; then
    echo -e "${RED}✗ Not Found (404)${NC}"
    echo "  Check your STORE_HASH"
    echo ""
    echo "$HTTP_BODY"
else
    echo -e "${RED}✗ Error ($HTTP_CODE)${NC}"
    echo ""
    echo "$HTTP_BODY"
fi

echo ""
echo -e "${YELLOW}Full Response:${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"

