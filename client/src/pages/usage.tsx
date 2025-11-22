import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import GTMChartsTab from "@/components/usage/GTMChartsTab";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-luxon';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

// Get default date range (last 30 days)
function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

export default function Usage() {
  const [activeTab, setActiveTab] = useState("usage");
  const defaultRange = getDefaultDateRange();
  const [metric, setMetric] = useState("credit_usage");
  const [startTime, setStartTime] = useState(defaultRange.startTime);
  const [endTime, setEndTime] = useState(defaultRange.endTime);
  const [limit, setLimit] = useState("100");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const [usageItems, setUsageItems] = useState<any[]>([]);

  const loadData = async () => {
    setError("");
    setLoading(true);

    const params = new URLSearchParams();
    if (metric) params.set("metric", metric);
    if (startTime) params.set("startTime", startTime);
    if (endTime) params.set("endTime", endTime);
    if (limit) params.set("limit", limit);

    try {
      const res = await fetch(`/api/usage?${params.toString()}`);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Request failed");
      }

      const items = json.items || [];
      setUsageItems(items);

      // Prepare chart data
      const labels = items.map((i: any) => new Date(i.period));
      const data = items.map((i: any) => i.count || 0);

      setChartData({
        labels,
        datasets: [
          {
            label: `${json.metric}`,
            data,
            borderColor: "rgb(37, 99, 235)",
            backgroundColor: "rgba(37, 99, 235, 0.15)",
            fill: true,
            tension: 0.25,
          },
        ],
      });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Auto-load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day" as const,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  // Calculate summary stats
  const totalCount = usageItems.reduce((acc, item) => acc + (item.count || 0), 0);
  const avgCount = usageItems.length > 0 ? Math.round(totalCount / usageItems.length) : 0;
  const peakCount = usageItems.length > 0 ? Math.max(...usageItems.map(i => i.count || 0)) : 0;

  // Usage Analytics Content Component
  const UsageAnalyticsContent = () => {
    if (loading && !chartData) {
      return (
        <div className="space-y-8">
          <Skeleton className="h-[500px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Usage Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time credit usage data from Voiceflow Analytics API
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={metric} onValueChange={(value) => { setMetric(value); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_usage">Credit Usage</SelectItem>
                <SelectItem value="interactions">Interactions</SelectItem>
                <SelectItem value="unique_users">Unique Users</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={loadData} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Load
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {metric === "credit_usage" ? "Credit Usage" : metric === "interactions" ? "Interactions" : "Unique Users"} Over Time
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                Last 30 days
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-total-usage">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total {metric === "credit_usage" ? "Credits" : metric === "interactions" ? "Interactions" : "Users"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {usageItems.length} data points
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-usage">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average per Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {avgCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg. daily count
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-peak-usage">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Peak Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {peakCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Highest daily count
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header - Centered */}
      <div className="max-w-7xl mx-auto px-6 pt-8 md:px-8 md:pt-12">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2" data-testid="text-usage-title">
            Usage Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Track usage metrics and Google Tag Manager analytics
          </p>
        </div>

        {/* Horizontal Tabs - Chrome Style */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab("usage")}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 relative border-b-2 ${
                activeTab === "usage"
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/50"
              }`}
            >
              Usage Analytics
            </button>
            <button
              onClick={() => setActiveTab("gtm")}
              className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 relative border-b-2 ${
                activeTab === "gtm"
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/50"
              }`}
            >
              GTM Charts
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Centered */}
      <div className="max-w-7xl mx-auto px-6 pb-8 md:px-8 md:pb-12">
        {activeTab === "usage" && <UsageAnalyticsContent />}
        {activeTab === "gtm" && <GTMChartsTab />}
      </div>
    </div>
  );
}
