# SaaSDashKit - Quick Start Guide

## 🚀 How to Use

### 1. Start the Server
```bash
cd /Users/tristan/Desktop/SaaSDashKit
npm run dev
```
Server will start on: http://localhost:3000

### 2. Login
1. Open http://localhost:3000 in your browser
2. Enter your credentials:
   - **Project ID**: `66aeff0ea380c590e96e8e70`
   - **Voiceflow API Key**: `VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR`
   - **Budget** (optional): Set your monthly budget

### 3. Features

#### 📊 Usage Analytics
- View real-time usage statistics
- Track credit consumption
- Monitor active conversations
- Visualize usage trends with charts

#### 📁 Knowledge Base Management
- **List files**: View all documents in your Voiceflow KB
- **Upload files**: Add new documents (PDF, TXT, DOCX, etc.)
- **Delete files**: Remove documents from KB

#### 💬 Transcript Viewer
- Browse conversation transcripts
- Search and filter conversations
- Export transcripts (JSON/TXT)
- Bulk export multiple transcripts

#### 💰 Budget Tracking
- Set monthly spending limits
- Track credit usage vs budget
- Get alerts when approaching limits
- View cost breakdowns

## 🔧 Current Status

### ✅ Working Features
- User authentication with Voiceflow credentials
- Usage analytics (pulling from Voiceflow Analytics API v2)
- Transcript viewing and export
- Budget tracking and alerts
- Session management

### ⚠️ Known Issue
**Knowledge Base uploads are currently blocked by Voiceflow API**
- Issue: All uploads return 409 "file already exists" error
- Cause: Voiceflow Knowledge Base API issue (not our code)
- Status: Requires Voiceflow support investigation
- See: `VOICEFLOW_KB_ISSUE_REPORT.md` for full details

**Workaround**: You can still:
- View existing KB files
- Manage files through Voiceflow Creator UI
- Delete files via API

## 📝 Login Credentials Flow

The system uses **session-based authentication**:

1. **You login** with your Project ID and API Key
2. **Credentials are stored** in a secure server-side session
3. **All API calls** automatically use YOUR credentials
4. **Each user** can have different credentials

**You don't need to hardcode credentials** - they come from your login!

## 🔍 Debugging

### View Debug Logs
```bash
curl http://localhost:3000/api/debug/logs?limit=50 | python3 -m json.tool
```

### Check Voiceflow Connectivity
```bash
curl http://localhost:3000/api/debug/voiceflow/check
```

### Test Specific Metrics
```bash
curl -X POST http://localhost:3000/api/usage/metric-test \
  -H 'Content-Type: application/json' \
  -d '{"metric":"interactions"}'
```

## 📚 Documentation

- **DEBUGGING_GUIDE.md** - Comprehensive debugging workflows
- **VOICEFLOW_KB_ISSUE_REPORT.md** - Details on current KB upload issue
- **design_guidelines.md** - UI/UX design principles

## 🆘 Need Help?

1. Check the debug logs: `GET /api/debug/logs`
2. Review the debugging guide: `DEBUGGING_GUIDE.md`
3. Run the test script: `node test-voiceflow-kb.mjs`
4. Check Voiceflow dashboard for account issues

---

**Note**: The Knowledge Base upload issue is being tracked. The code implementation is correct and ready to use once Voiceflow resolves their API issue.
