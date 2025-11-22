# AI Analysis - Possible Relevant Charts

This document lists all possible relevant charts that could be displayed in the AI Analysis page.

## Currently Implemented Charts

1. **AI Token Usage Over Time** (Left Chart)
   - Shows token consumption from usage records
   - Grouped by date (last 30 days)
   - Bar chart format
   - Data source: `/api/usage-records`

2. **Conversion Rate & Sentiment Trend** (Right Chart)
   - Shows conversion rate and sentiment trends across analyses
   - Line chart format
   - Data source: AI analyses data

## Additional Possible Charts

### 1. Analysis Frequency Over Time
- **Description**: Number of analyses run per day/week/month
- **Chart Type**: Bar chart or Line chart
- **Data Source**: Count of analyses grouped by date
- **Use Case**: Track how frequently analyses are being run

### 2. Total Transcripts Analyzed Over Time
- **Description**: Cumulative or per-analysis transcript count
- **Chart Type**: Line chart or Area chart
- **Data Source**: `totalTranscripts` from analyses
- **Use Case**: Monitor growth in transcript volume

### 3. Cost per Analysis
- **Description**: Estimated cost of running each analysis (based on OpenAI API usage)
- **Chart Type**: Bar chart
- **Data Source**: Calculate from token usage or API calls
- **Use Case**: Track spending on AI analysis features

### 4. Keywords Frequency Distribution
- **Description**: Distribution of keyword frequencies (histogram)
- **Chart Type**: Histogram or Bar chart
- **Data Source**: Keywords from selected analysis
- **Use Case**: Understand keyword distribution patterns

### 5. Keyphrases Frequency Distribution
- **Description**: Distribution of keyphrase frequencies
- **Chart Type**: Histogram or Bar chart
- **Data Source**: Keyphrases from selected analysis
- **Use Case**: Understand keyphrase distribution patterns

### 6. Category Distribution (from Keywords)
- **Description**: Pie chart or bar chart showing keyword categories
- **Chart Type**: Pie chart or Bar chart
- **Data Source**: Keyword categories from analyses
- **Use Case**: Visualize keyword categorization

### 7. Analysis Success Rate
- **Description**: Percentage of successful analyses vs failed ones
- **Chart Type**: Pie chart or Donut chart
- **Data Source**: Track analysis completion status
- **Use Case**: Monitor analysis reliability

### 8. Sentiment Distribution
- **Description**: Distribution of sentiment scores (positive/neutral/negative)
- **Chart Type**: Pie chart or Bar chart
- **Data Source**: `averageSentiment` from analyses
- **Use Case**: Overall sentiment overview

### 9. Conversion Rate Distribution
- **Description**: Histogram of conversion rates across analyses
- **Chart Type**: Histogram
- **Data Source**: `conversionRate` from analyses
- **Use Case**: Understand conversion rate variability

### 10. Top Keywords Over Time
- **Description**: Track top keywords across multiple analyses
- **Chart Type**: Line chart or Heatmap
- **Data Source**: Keywords from all analyses
- **Use Case**: Identify trending keywords

### 11. Usage Category Breakdown
- **Description**: Token usage by category (api_calls, storage, compute, bandwidth)
- **Chart Type**: Pie chart or Stacked bar chart
- **Data Source**: Usage records with categories
- **Use Case**: Understand where tokens are being used

### 12. Analysis Duration Over Time
- **Description**: Time taken to complete each analysis
- **Chart Type**: Line chart or Bar chart
- **Data Source**: Track analysis start/end times
- **Use Case**: Monitor performance and optimization needs

### 13. Average Relevance Score Trend
- **Description**: Average relevance scores of keywords/keyphrases over time
- **Chart Type**: Line chart
- **Data Source**: Relevance scores from keywords/keyphrases
- **Use Case**: Track quality of insights over time

### 14. Transcript Volume vs Analysis Count
- **Description**: Correlation between transcript volume and number of analyses
- **Chart Type**: Scatter plot or Dual-axis line chart
- **Data Source**: Transcript counts and analysis dates
- **Use Case**: Understand analysis frequency relative to data volume

### 15. Cost Efficiency (Tokens per Analysis)
- **Description**: Token usage per analysis
- **Chart Type**: Bar chart or Line chart
- **Data Source**: Usage records and analysis timestamps
- **Use Case**: Optimize cost efficiency

### 16. Keyword Category Trends
- **Description**: How keyword categories change over time
- **Chart Type**: Stacked area chart or Grouped bar chart
- **Data Source**: Keyword categories from analyses
- **Use Case**: Identify shifting focus areas

### 17. Sentiment vs Conversion Correlation
- **Description**: Scatter plot showing relationship between sentiment and conversion
- **Chart Type**: Scatter plot
- **Data Source**: `averageSentiment` and `conversionRate` from analyses
- **Use Case**: Understand if sentiment affects conversion

### 18. Top Keyphrases Over Time
- **Description**: Track top keyphrases across multiple analyses
- **Chart Type**: Line chart or Heatmap
- **Data Source**: Keyphrases from all analyses
- **Use Case**: Identify trending topics

### 19. Analysis Completion Rate
- **Description**: Percentage of analyses that completed successfully
- **Chart Type**: Gauge chart or Progress bar
- **Data Source**: Track analysis status
- **Use Case**: Monitor system reliability

### 20. Daily/Weekly/Monthly Aggregates
- **Description**: Aggregated metrics by time period
- **Chart Type**: Bar chart or Line chart
- **Data Source**: Group analyses by time period
- **Use Case**: High-level trend analysis

## Recommended Priority Charts

Based on relevance and data availability:

1. ✅ **AI Token Usage Over Time** (Implemented)
2. ✅ **Conversion Rate & Sentiment Trend** (Implemented)
3. **Analysis Frequency Over Time** - Easy to implement, useful for tracking usage
4. **Total Transcripts Analyzed Over Time** - Shows data growth
5. **Sentiment Distribution** - Quick overview of sentiment patterns
6. **Usage Category Breakdown** - Understand token usage patterns
7. **Top Keywords Over Time** - Identify trending topics
8. **Sentiment vs Conversion Correlation** - Business insights

## Notes

- Charts should be responsive and work well on mobile devices
- Consider using tooltips for detailed information
- Ensure charts are accurate and use real data from the database
- Date filtering should apply to all charts consistently
- Consider caching chart data for performance

