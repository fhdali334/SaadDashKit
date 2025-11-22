#!/bin/bash
exec > /tmp/vf-api-test.log 2>&1

echo "Starting Voiceflow API test at $(date)"
echo "===================================="

API_KEY="VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR"
PROJECT_ID="66aeff0ea380c590e96e8e70"

echo ""
echo "Test 1: List Knowledge Base Documents"
echo "--------------------------------------"
curl -i -X GET "https://api.voiceflow.com/v1/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "projectID: ${PROJECT_ID}"

echo ""
echo ""
echo "Test 2: Upload File"
echo "-------------------"
echo "Test content for KB" > /tmp/test-upload.txt
curl -i -X POST "https://api.voiceflow.com/v1/knowledge-base/docs/upload?maxChunkSize=1000" \
  -H "accept: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "projectID: ${PROJECT_ID}" \
  -F "file=@/tmp/test-upload.txt"

echo ""
echo ""
echo "Test completed at $(date)"

