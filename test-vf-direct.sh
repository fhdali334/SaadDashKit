#!/bin/bash

# Test Voiceflow Knowledge Base API directly
API_KEY="VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR"
PROJECT_ID="66aeff0ea380c590e96e8e70"
API_BASE="https://api.voiceflow.com/v1"

echo "=== Testing Voiceflow Knowledge Base API ==="
echo ""
echo "1. Testing List Documents..."
curl -w "\nHTTP Status: %{http_code}\n" \
  -X GET "${API_BASE}/knowledge-base/docs?page=1&limit=10" \
  -H "accept: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "projectID: ${PROJECT_ID}"

echo ""
echo ""
echo "2. Creating test file..."
echo "This is a test document for Voiceflow Knowledge Base upload" > /tmp/test-kb-upload.txt

echo "3. Testing File Upload..."
curl -w "\nHTTP Status: %{http_code}\n" \
  -X POST "${API_BASE}/knowledge-base/docs/upload?maxChunkSize=1000" \
  -H "accept: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "projectID: ${PROJECT_ID}" \
  -F "file=@/tmp/test-kb-upload.txt"

echo ""
echo ""
echo "=== Tests Complete ==="

