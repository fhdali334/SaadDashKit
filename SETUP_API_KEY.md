# Set Your OpenAI API Key

## Quick Setup

Since `.env` files are protected for security, please set your API key manually:

### Option 1: Create .env file (Recommended)

Create a file named `.env` in the project root with this content:

```bash
# Session Secret
SESSION_SECRET=dev-only-secret-change-in-production-12345

# OpenAI API Key for AI Analysis
OPENAI_API_KEY=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

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Option 2: Set Environment Variable Directly

**macOS/Linux:**
```bash
export OPENAI_API_KEY="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"
npm run dev
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="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"
npm run dev
```

**Windows (CMD):**
```cmd
set OPENAI_API_KEY=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
npm run dev
```

## Verify Setup

After setting the API key and restarting the server:

1. Go to http://localhost:5000
2. Login with your Voiceflow project ID
3. Navigate to **AI Analysis** in the sidebar
4. Click **"Run New Analysis"**
5. The analysis should start successfully

## Troubleshooting

If you see "OpenAI API key not configured":
- Make sure the `.env` file is in the project root (same folder as `package.json`)
- Restart the server after creating `.env`
- Check that the API key starts with `sk-proj-`

## Security Note

⚠️ **Never commit your `.env` file to git!**
- The `.env` file is already in `.gitignore`
- This keeps your API key secure
- Share API keys only through secure channels

