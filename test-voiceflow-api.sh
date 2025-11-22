#!/bin/bash

echo "=== Voiceflow API Testing Script ==="
echo "Testing different API formats to find the working one..."
echo ""

API_KEY="VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR"
PROJECT_ID="66aeff0ea380c590e96e8e70"

echo "1. Testing v1 API with project ID in URL path:"
echo "Command: curl -X GET \"https://api.voiceflow.com/v1/knowledge-base/$PROJECT_ID/docs?page=1&limit=5\" -H \"accept: application/json\" -H \"Authorization: $API_KEY\""
curl -X GET "https://api.voiceflow.com/v1/knowledge-base/$PROJECT_ID/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY"
echo -e "\nHTTP Status: $?"
echo ""

echo "2. Testing v2 API with project ID in URL path:"
echo "Command: curl -X GET \"https://api.voiceflow.com/v2/knowledge-base/$PROJECT_ID/docs?page=1&limit=5\" -H \"accept: application/json\" -H \"Authorization: $API_KEY\""
curl -X GET "https://api.voiceflow.com/v2/knowledge-base/$PROJECT_ID/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY"
echo -e "\nHTTP Status: $?"
echo ""

echo "3. Testing v1 API with Bearer token:"
echo "Command: curl -X GET \"https://api.voiceflow.com/v1/knowledge-base/$PROJECT_ID/docs?page=1&limit=5\" -H \"accept: application/json\" -H \"Authorization: Bearer $API_KEY\""
curl -X GET "https://api.voiceflow.com/v1/knowledge-base/$PROJECT_ID/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $API_KEY"
echo -e "\nHTTP Status: $?"
echo ""

echo "4. Testing with projectID as query parameter:"
echo "Command: curl -X GET \"https://api.voiceflow.com/v1/knowledge-base/docs?projectID=$PROJECT_ID&page=1&limit=5\" -H \"accept: application/json\" -H \"Authorization: $API_KEY\""
curl -X GET "https://api.voiceflow.com/v1/knowledge-base/docs?projectID=$PROJECT_ID&page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY"
echo -e "\nHTTP Status: $?"
echo ""

echo "5. Testing basic user endpoint to validate API key:"
echo "Command: curl -X GET \"https://api.voiceflow.com/v1/user\" -H \"accept: application/json\" -H \"Authorization: $API_KEY\""
curl -X GET "https://api.voiceflow.com/v1/user" \
  -H "accept: application/json" \
  -H "Authorization: $API_KEY"
echo -e "\nHTTP Status: $?"
echo ""

echo "=== Tests Complete ==="
echo "Look for successful responses (not HTML error pages) to find the working format!"
