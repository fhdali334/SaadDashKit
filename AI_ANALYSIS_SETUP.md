# AI Analysis Feature - Quick Setup Guide

## Prerequisites

1. **Voiceflow Account**: With API access and transcripts
2. **OpenAI Account**: With API access and credits

## Step 1: Get API Keys

### Voiceflow API Key
1. Go to [Voiceflow](https://www.voiceflow.com/)
2. Navigate to your workspace settings
3. Generate an API key (format: `VF.DM.xxxx...`)

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create a new secret key (format: `sk-xxxx...`)

## Step 2: Configure Environment Variables

Create or update your `.env` file in the project root:

```bash
# Required for AI Analysis
OPENAI_API_KEY=sk-your-actual-openai-api-key

# Session security (required)
SESSION_SECRET=your-random-secret-here

# Optional - can be set in UI Settings page
VOICEFLOW_API_KEY=VF.DM.your-actual-voiceflow-api-key
```

## Step 3: Restart the Server

```bash
npm run dev
```

## Step 4: Configure in UI (Alternative)

If you didn't set `VOICEFLOW_API_KEY` in the environment:

1. Login to the dashboard
2. Go to **Settings**
3. Enter your Voiceflow API Key
4. Click Save

## Step 5: Run Your First Analysis

1. Navigate to **AI Analysis** in the sidebar
2. Click **"Run New Analysis"**
3. Wait 2-5 minutes for analysis to complete
4. View results and download report

## What Gets Analyzed

The AI Analysis feature will:
- ✅ Fetch up to 50 recent transcripts from Voiceflow
- ✅ Extract all user and AI messages
- ✅ Send to OpenAI for analysis
- ✅ Calculate conversion rate and sentiment
- ✅ Identify business-relevant keywords and keyphrases
- ✅ Generate insights and pattern recommendations
- ✅ Store results in database
- ✅ Generate downloadable report

## Cost Estimate

**Voiceflow API**: Free (within your plan limits)

**OpenAI API**: Approximately $0.01-0.05 per analysis
- Model: gpt-4o-mini
- Tokens: ~10,000-30,000 depending on transcript length
- Current pricing: ~$0.15 per 1M input tokens

## Example Analysis Results

After running an analysis, you'll see:

### Metrics
- **Conversion Rate**: 75.5%
- **Average Sentiment**: Positive (+0.68)
- **Transcripts Analyzed**: 50

### Sample Keywords
- "appointment" (Frequency: 42, Relevance: 89%)
- "schedule" (Frequency: 38, Relevance: 85%)
- "availability" (Frequency: 31, Relevance: 78%)

### Sample Keyphrases
- "book appointment after 8pm" (Frequency: 15, Relevance: 92%)
- "reschedule existing appointment" (Frequency: 12, Relevance: 88%)
- "check doctor availability" (Frequency: 10, Relevance: 85%)

### Sample Insights
1. Multiple users are requesting appointments past 8pm, indicating demand for extended hours
2. High conversion rate suggests chatbot is effectively handling standard booking requests
3. Positive sentiment overall, with most users satisfied with the booking process

## Troubleshooting

### Issue: "OpenAI API key not configured"
**Solution**: 
- Set `OPENAI_API_KEY` in your `.env` file
- Restart the server

### Issue: "No transcripts found to analyze"
**Solution**:
- Ensure your Voiceflow project has transcripts
- Verify project ID is correct
- Check API key has proper permissions

### Issue: Analysis takes too long
**Solution**:
- This is normal for first run (2-5 minutes)
- Check server logs for progress
- Verify network connectivity

### Issue: OpenAI API errors
**Solution**:
- Verify API key is valid
- Check you have credits in your OpenAI account
- Review rate limits

## Next Steps

1. ✅ Run your first analysis
2. ✅ Review keywords and keyphrases
3. ✅ Download the full report
4. ✅ Use insights to improve your chatbot
5. ✅ Run periodic analyses to track improvements

For detailed documentation, see [AI_ANALYSIS_README.md](./AI_ANALYSIS_README.md)

## Support

- **Documentation**: See AI_ANALYSIS_README.md
- **Server Logs**: Check console output for detailed error messages
- **Network**: Verify API connectivity to both Voiceflow and OpenAI

