#!/bin/bash

# Comprehensive test of Voiceflow API variations
LOG_FILE="/tmp/comprehensive-api-test.log"
exec > "$LOG_FILE" 2>&1

echo "=== Comprehensive Voiceflow API Test ==="
echo "Started at: $(date)"
echo ""

API_KEY="VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR"
PROJECT_ID="66aeff0ea380c590e96e8e70"
BASE_URL="https://api.voiceflow.com/v1"

echo "1. Testing with Bearer prefix and projectID:"
echo "curl -X GET \"$BASE_URL/knowledge-base/docs?page=1&limit=5\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: Bearer $API_KEY\" \\"
echo "  -H \"projectID: $PROJECT_ID\""
curl -X GET "$BASE_URL/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "projectID: $PROJECT_ID" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

echo "2. Testing without Bearer prefix:"
curl -X GET "$BASE_URL/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

echo "3. Testing with Bearer but no projectID:"
curl -X GET "$BASE_URL/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

echo "4. Testing v2 API endpoint:"
curl -X GET "https://api.voiceflow.com/v2/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

echo "5. Testing different endpoint format:"
curl -X GET "$BASE_URL/knowledge-base/documents?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

echo "Completed at: $(date)"
echo "Results written to: $LOG_FILE"
