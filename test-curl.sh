#!/bin/bash

echo "Starting test..."
echo "=================="

echo ""
echo "Testing Voiceflow API GET request:"
curl -X GET "https://api.voiceflow.com/v1/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: Bearer VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR" \
  -H "projectID: 66aeff0ea380c590e96e8e70" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "Test complete!"

