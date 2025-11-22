#!/usr/bin/env node
/**
 * Direct test of Voiceflow Knowledge Base API
 * This will help us debug the 409 error issue
 */

import FormData from 'form-data';
import { Buffer } from 'buffer';

const API_KEY = "VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR";
const PROJECT_ID = "68e56f7170abdf09f66dc756";
const BASE_URL = "https://api.voiceflow.com";

async function testListDocuments() {
  console.log("\n========================================");
  console.log("TEST 1: List all documents");
  console.log("========================================");
  
  const url = `${BASE_URL}/v1/knowledge-base/docs?limit=100`;
  console.log("URL:", url);
  console.log("API Key (first 20 chars):", API_KEY.substring(0, 20));
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log("\n✅ SUCCESS");
      console.log("Total documents:", data.total);
      console.log("Documents returned:", data.data?.length || 0);
      
      if (data.data && data.data.length > 0) {
        console.log("\nDocuments:");
        data.data.forEach((doc, idx) => {
          console.log(`  ${idx + 1}. ID: ${doc.documentID}, Name: ${doc.name || 'Untitled'}`);
        });
      }
      return data;
    } else {
      console.log("❌ FAILED");
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

async function testUploadWithOverwrite() {
  console.log("\n========================================");
  console.log("TEST 2: Test upload with overwrite=true");
  console.log("========================================");
  
  // Create a small test file content
  const testContent = "This is a test file created at " + new Date().toISOString();
  const buffer = Buffer.from(testContent, 'utf-8');
  
  const FormData = require('form-data');
  const formData = new FormData();
  
  // Use a simple filename to test
  const fileName = "test-simple.txt";
  formData.append('file', buffer, {
    filename: fileName,
    contentType: 'text/plain',
  });
  
  const url = `${BASE_URL}/v1/knowledge-base/docs/upload?overwrite=true`;
  console.log("URL:", url);
  console.log("Filename:", fileName);
  console.log("Buffer size:", buffer.length);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        ...formData.getHeaders(),
      },
      body: formData,
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
    
    if (response.ok) {
      console.log("\n✅ SUCCESS - File uploaded!");
      const data = JSON.parse(text);
      console.log("Document ID:", data.data?.documentID);
      return data;
    } else {
      console.log("❌ FAILED");
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

async function testUploadWithoutOverwrite() {
  console.log("\n========================================");
  console.log("TEST 3: Test upload WITHOUT overwrite");
  console.log("========================================");
  
  const testContent = "This is a test file created at " + new Date().toISOString();
  const buffer = Buffer.from(testContent, 'utf-8');
  
  const formData = new FormData();
  
  const fileName = "test-simple2.txt";
  formData.append('file', buffer, {
    filename: fileName,
    contentType: 'text/plain',
  });
  
  const url = `${BASE_URL}/v1/knowledge-base/docs/upload`;
  console.log("URL:", url);
  console.log("Filename:", fileName);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        ...formData.getHeaders(),
      },
      body: formData,
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
    
    if (response.ok) {
      console.log("\n✅ SUCCESS - File uploaded!");
      return JSON.parse(text);
    } else {
      console.log("❌ FAILED");
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

async function runTests() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  Voiceflow Knowledge Base API Test    ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("\nProject ID:", PROJECT_ID);
  console.log("API Key:", API_KEY.substring(0, 20) + "...");
  
  // Test 1: List documents
  await testListDocuments();
  
  // Test 2: Upload with overwrite
  await testUploadWithOverwrite();
  
  // Test 3: List again to see if file was added
  console.log("\n========================================");
  console.log("TEST 4: List documents after upload");
  console.log("========================================");
  await testListDocuments();
  
  // Test 4: Upload without overwrite (should work for new file)
  await testUploadWithoutOverwrite();
  
  // Final list
  console.log("\n========================================");
  console.log("FINAL: List all documents");
  console.log("========================================");
  await testListDocuments();
  
  console.log("\n✨ Tests complete!");
}

runTests().catch(console.error);

