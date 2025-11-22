#!/bin/bash

# Test Voiceflow Knowledge Base API

# Get API key from settings (you'll need to paste it)
echo "Enter your Voiceflow API key:"
read -s API_KEY

# Test file
TEST_FILE="/Users/tristan/Desktop/SaaSDashKit/README.md"

echo ""
echo "=== Testing Voiceflow Knowledge Base API ==="
echo ""

# Test 1: List documents (GET)
echo "1. Testing GET /v1/knowledge-base/docs"
echo "URL: https://api.voiceflow.com/v1/knowledge-base/docs?page=1&limit=10"
curl -v https://api.voiceflow.com/v1/knowledge-base/docs?page=1\&limit=10 \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY" \
  2>&1 | grep -E "(< HTTP|< content-type|^\{|error|status)"

echo ""
echo ""

# Test 2: Upload document (POST)
echo "2. Testing POST /v1/knowledge-base/docs/upload"
echo "URL: https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=1000"
echo "File: $TEST_FILE"
curl -v https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=1000 \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY" \
  -F "file=@$TEST_FILE" \
  2>&1 | head -50

echo ""
echo "=== Test complete ==="

