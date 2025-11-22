# Usage Tab - Feature Summary

## 🎯 Key Features

### 1. **Auto-Load on Page Load** ✅
- Chart automatically loads credit usage data when the page opens
- No need to click "Load" button - data displays immediately
- Shows last 30 days of data by default

### 2. **Big Centered Chart** ✅
- Large 500px height chart for clear visibility
- Smooth line chart with fill gradient
- Time-based X-axis with daily granularity
- Auto-scaling Y-axis

### 3. **No Project ID Input** ✅
- Project ID is automatically pulled from user session
- Seamless multi-tenant support
- Users only see their own project data

### 4. **Credit Usage by Default** ✅
- Defaults to showing `credit_usage` metric
- Most important metric displayed first
- Can switch to other metrics via dropdown

### 5. **Clean UI** ✅
- Minimal controls - just metric selector and refresh button
- Chart takes center stage
- Three summary cards below showing:
  - Total Credits/Interactions/Users
  - Average per Period
  - Peak Usage

### 6. **Real-Time Refresh** ✅
- Refresh button with spinning animation
- Reloads latest data from Voiceflow API
- Keeps current metric selection

### 7. **Loading States** ✅
- Skeleton loaders on initial page load
- Smooth loading animations
- No layout shifts

## 📊 Available Metrics

Users can switch between:
1. **Credit Usage** (default) - Total credits consumed
2. **Interactions** - Number of chatbot interactions
3. **Unique Users** - Count of unique users

## 🔄 Data Flow

```
User opens Usage tab
    ↓
Frontend automatically calls /api/usage
    ↓
Backend uses session's projectId + VF_API_KEY
    ↓
Fetches from Voiceflow Analytics API v2
    ↓
Returns paginated data (last 30 days)
    ↓
Chart renders with credit_usage data
```

## 🎨 UI Layout

```
┌─────────────────────────────────────────────┐
│  Credit Usage            [Dropdown] [🔄]    │
│  Real-time credit usage data...              │
├─────────────────────────────────────────────┤
│                                               │
│         BIG CHART (500px)                    │
│         Credit Usage Over Time               │
│                                               │
│         [Line chart with gradient fill]      │
│                                               │
├─────────────────────────────────────────────┤
│  [Total Credits] [Avg per Period] [Peak]    │
│       12,345          411         1,234      │
└─────────────────────────────────────────────┘
```

## 🔧 Technical Details

- **Chart Library**: Chart.js with react-chartjs-2
- **Time Adapter**: chartjs-adapter-luxon for proper date handling
- **Date Range**: Last 30 days (calculated dynamically)
- **API Endpoint**: `/api/usage?metric=credit_usage&startTime=...&endTime=...`
- **Authentication**: Session-based with requireAuth middleware
- **API Key Source**: Session config → VF_API_KEY env → VOICEFLOW_API_KEY env

## ✨ User Experience

1. **Login** → User enters project ID and logs in
2. **Navigate to Usage tab** → Chart loads automatically
3. **View data** → See credit usage for last 30 days
4. **Switch metrics** → Select dropdown to see interactions or users
5. **Refresh** → Click refresh icon to reload latest data

No configuration needed, no forms to fill out, just instant insights! 🚀

