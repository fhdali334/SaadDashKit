#!/bin/bash
echo "=== Voiceflow API Test Results ===" > /tmp/api-test-results.log
echo "Test started at: $(date)" >> /tmp/api-test-results.log
echo "" >> /tmp/api-test-results.log

echo "1. Testing GET request to Voiceflow Knowledge Base API..." >> /tmp/api-test-results.log
curl -X GET "https://api.voiceflow.com/v1/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: Bearer VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR" \
  -H "projectID: 66aeff0ea380c590e96e8e70" \
  -w "\nHTTP Status: %{http_code}\n" \
  2>> /tmp/api-test-results.log >> /tmp/api-test-results.log

echo "" >> /tmp/api-test-results.log
echo "2. Testing without Bearer prefix..." >> /tmp/api-test-results.log
curl -X GET "https://api.voiceflow.com/v1/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR" \
  -H "projectID: 66aeff0ea380c590e96e8e70" \
  -w "\nHTTP Status: %{http_code}\n" \
  2>> /tmp/api-test-results.log >> /tmp/api-test-results.log

echo "" >> /tmp/api-test-results.log
echo "3. Testing without projectID header..." >> /tmp/api-test-results.log
curl -X GET "https://api.voiceflow.com/v1/knowledge-base/docs?page=1&limit=5" \
  -H "accept: application/json" \
  -H "Authorization: Bearer VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR" \
  -w "\nHTTP Status: %{http_code}\n" \
  2>> /tmp/api-test-results.log >> /tmp/api-test-results.log

echo "" >> /tmp/api-test-results.log
echo "Test completed at: $(date)" >> /tmp/api-test-results.log
