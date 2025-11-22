# AI Analysis Feature

## Overview

The AI Analysis feature uses OpenAI's GPT-4 to analyze Voiceflow transcripts and provide business insights including:

- **Conversion Rate**: Ratio of successful conversations to total conversations
- **Sentiment Analysis**: Average sentiment score across all transcripts (-1 to 1 scale)
- **Business Keywords**: AI-identified relevant terms (excluding common words like "if", "can", "the")
- **Keyphrases**: Meaningful 2-5 word phrases that appear in conversations
- **Insights**: Key findings and business opportunities
- **Patterns**: Recurring themes or issues
- **Downloadable Reports**: Text-based analysis reports

## Setup

### Environment Variables

Add the following to your `.env` file:

```bash
# Required for AI Analysis
OPENAI_API_KEY=sk-your-openai-api-key-here

# Existing required variables
VOICEFLOW_API_KEY=VF.DM.your-api-key
SESSION_SECRET=your-session-secret
```

### Installation

No additional packages are required. The feature uses:
- OpenAI API via REST (fetch)
- Built-in file system for report generation
- Existing database storage system

## Usage

### Running an Analysis

1. Navigate to **AI Analysis** in the sidebar
2. Click **"Run New Analysis"** button
3. Wait for the analysis to complete (this may take a few minutes)
4. View results including:
   - Conversion rate and sentiment metrics
   - Key insights and patterns
   - Top keywords and keyphrases
   - Download the full report

### Understanding the Results

#### Conversion Rate
- **Range**: 0% to 100%
- **Meaning**: Percentage of conversations that resulted in successful outcomes
- **Use**: Measure chatbot effectiveness at completing user goals

#### Average Sentiment
- **Range**: -1 (very negative) to 1 (very positive)
- **Display**: Positive, Neutral, or Negative
- **Use**: Understand overall user satisfaction

#### Keywords
- **Format**: Single business-relevant terms
- **Metrics**: Frequency count and relevance score (0-100%)
- **Category**: Optional AI-assigned category
- **Use**: Identify main topics and concerns

#### Keyphrases
- **Format**: 2-5 word meaningful phrases
- **Metrics**: Frequency count and relevance score (0-100%)
- **Context**: Brief explanation of usage
- **Use**: Discover specific patterns in user requests

#### Insights
- AI-generated key findings
- Business opportunities
- Recommended actions

#### Patterns
- Recurring themes across conversations
- Common user behaviors
- Identified issues or bottlenecks

### Historical Analyses

All analyses are saved and can be viewed later. Click on any previous analysis card to view its full details.

### Downloading Reports

Click the **Download** button to get a comprehensive text report that includes:
- Executive summary
- All metrics and statistics
- Full list of keywords and keyphrases
- Insights and patterns
- Recommendations

## API Endpoints

### POST `/api/ai-analysis/analyze`
Fetches transcripts from Voiceflow and analyzes them with OpenAI.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "analysis": {
    "id": "uuid",
    "projectId": "string",
    "analysisDate": "ISO date",
    "conversionRate": 0.75,
    "averageSentiment": 0.45,
    "totalTranscripts": 50,
    "reportUrl": "/api/ai-analysis/report/filename.txt",
    "insights": ["insight 1", "insight 2"],
    "patterns": ["pattern 1", "pattern 2"]
  },
  "reportFilename": "ai-analysis-report-timestamp.txt"
}
```

### GET `/api/ai-analysis`
Get all analyses for the current project.

**Authentication**: Required

**Response**:
```json
[
  {
    "id": "uuid",
    "projectId": "string",
    "analysisDate": "ISO date",
    "conversionRate": 0.75,
    "averageSentiment": 0.45,
    "totalTranscripts": 50,
    "reportUrl": "/api/ai-analysis/report/filename.txt",
    "createdAt": "ISO date"
  }
]
```

### GET `/api/ai-analysis/:id`
Get specific analysis with keywords and keyphrases.

**Authentication**: Required

**Response**:
```json
{
  "id": "uuid",
  "projectId": "string",
  "analysisDate": "ISO date",
  "conversionRate": 0.75,
  "averageSentiment": 0.45,
  "totalTranscripts": 50,
  "reportUrl": "/api/ai-analysis/report/filename.txt",
  "keywords": [
    {
      "id": "uuid",
      "keyword": "appointment",
      "frequency": 42,
      "relevanceScore": 0.89,
      "category": "scheduling"
    }
  ],
  "keyphrases": [
    {
      "id": "uuid",
      "keyphrase": "book appointment after 8pm",
      "frequency": 15,
      "relevanceScore": 0.92,
      "context": "Users requesting late evening appointments"
    }
  ]
}
```

### GET `/api/ai-analysis/report/:filename`
Download a report file.

**Authentication**: Required

**Response**: File download

## Technical Details

### Transcript Fetching

The analysis uses the same API method as the transcript exporter:
- Fetches from Voiceflow Analytics API (`/v1/transcript/project/:projectId`)
- Paginated requests (100 per page)
- Fetches detailed logs for each transcript
- Extracts user and AI messages
- Limits to 50 transcripts for performance (configurable)

### AI Analysis

Uses OpenAI's `gpt-4o-mini` model with:
- System prompt defining analysis requirements
- JSON response format
- Temperature: 0.3 (for consistent, focused results)
- Max content: 50,000 characters

### Data Storage

Metrics are stored in the in-memory database (MemStorage):
- **AiAnalysis**: Main analysis record with metrics
- **AiKeyword**: Individual keywords with scores
- **AiKeyphrase**: Individual keyphrases with context

### Report Generation

Reports are generated as plain text files and saved to the `uploads/` directory with:
- Timestamp-based filenames
- Executive summary
- Full keyword and keyphrase lists
- Insights and recommendations

## Limitations

1. **Transcript Limit**: Currently analyzes up to 50 transcripts per run (configurable at line 1354 in `server/routes.ts`)
2. **Token Limit**: OpenAI content is limited to 50,000 characters
3. **Rate Limits**: Subject to OpenAI API rate limits
4. **Storage**: Uses in-memory storage (data lost on server restart)
5. **Cost**: Each analysis makes one OpenAI API call (typically $0.01-0.05 per analysis)

## Future Enhancements

Potential improvements:
- [ ] Persistent database storage
- [ ] Configurable transcript limit
- [ ] Scheduled automatic analyses
- [ ] Trend tracking over time
- [ ] Email notifications
- [ ] Export to DOCX format with styling
- [ ] Custom AI prompt templates
- [ ] Multi-language support
- [ ] Integration with other analytics platforms

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `OPENAI_API_KEY` is set in your `.env` file
- Restart the server after adding the variable

### "Voiceflow API key not configured"
- Configure your Voiceflow API key in Settings
- Or set `VOICEFLOW_API_KEY` in `.env`

### "No transcripts found to analyze"
- Ensure your project has transcripts in Voiceflow
- Check that the project ID is correct
- Verify API key has access to the project

### Analysis takes too long
- Normal for large datasets (2-5 minutes)
- Reduce transcript limit in code if needed
- Check network connectivity

### OpenAI API errors
- Verify API key is valid and has credits
- Check OpenAI service status
- Review rate limits on your OpenAI account

## Support

For issues or questions:
1. Check this documentation
2. Review the console logs for error details
3. Verify all environment variables are set correctly
4. Ensure API keys have proper permissions

