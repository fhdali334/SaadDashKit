#!/bin/bash

echo "=== Voiceflow API Debug Tests ==="
echo "Run these commands one by one to find the working format:"
echo ""

echo "1. Test basic API key validation:"
echo "curl -X GET \"https://api.voiceflow.com/v1/user\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR\""
echo ""

echo "2. Test project access:"
echo "curl -X GET \"https://api.voiceflow.com/v1/projects/66aeff0ea380c590e96e8e70\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR\""
echo ""

echo "3. Test knowledge base with project in URL:"
echo "curl -X GET \"https://api.voiceflow.com/v1/knowledge-base/66aeff0ea380c590e96e8e70/docs?page=1&limit=5\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR\""
echo ""

echo "4. Test knowledge base with query parameter:"
echo "curl -X GET \"https://api.voiceflow.com/v1/knowledge-base/docs?projectID=66aeff0ea380c590e96e8e70&page=1&limit=5\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR\""
echo ""

echo "5. Test v2 API:"
echo "curl -X GET \"https://api.voiceflow.com/v2/knowledge-base/docs?page=1&limit=5\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR\""
echo ""

echo "6. Test with Bearer prefix:"
echo "curl -X GET \"https://api.voiceflow.com/v1/knowledge-base/docs?page=1&limit=5\" \\"
echo "  -H \"accept: application/json\" \\"
echo "  -H \"Authorization: Bearer VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR\" \\"
echo "  -H \"projectID: 66aeff0ea380c590e96e8e70\""
echo ""

echo "Copy and run each command individually and share the HTTP status codes and responses."
