"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, RefreshCw, TrendingUp, ArrowUpRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { MOCK_USAGE_DATA } from "@/lib/mock-usage-data"
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
} from "chart.js"
import { Line } from "react-chartjs-2"
import "chartjs-adapter-luxon"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale)

export function UsageAnalyticsSection() {
  const [metric, setMetric] = useState("credit_usage")
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any>(null)
  const [usageItems, setUsageItems] = useState<any[]>([])
  const [error, setError] = useState("")
  const [usesMockData, setUsesMockData] = useState(false)

  const loadData = async () => {
    setError("")
    setLoading(true)
    setUsesMockData(false)

    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const params = new URLSearchParams({
        metric,
        startTime: thirtyDaysAgo.toISOString(),
        endTime: now.toISOString(),
        limit: "100",
      })

      const res = await fetch(`/api/usage?${params.toString()}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Request failed")
      }

      const items = json.items || []

      // Use mock data if API returns empty
      if (items.length === 0) {
        console.log("[v0] No API data received, using mock data")
        setUsesMockData(true)
        setUsageItems(MOCK_USAGE_DATA)
        prepareChartData(MOCK_USAGE_DATA)
      } else {
        setUsageItems(items)
        prepareChartData(items)
      }
    } catch (e: any) {
      console.log("[v0] API error, falling back to mock data:", e.message)
      setError(e.message || String(e))
      setUsesMockData(true)
      setUsageItems(MOCK_USAGE_DATA)
      prepareChartData(MOCK_USAGE_DATA)
    } finally {
      setLoading(false)
    }
  }

  const prepareChartData = (items: any[]) => {
    const labels = items.map((i: any) => new Date(i.period).toLocaleDateString())
    const data = items.map((i: any) => i.count || 0)

    setChartData({
      labels,
      datasets: [
        {
          label: `${metric === "credit_usage" ? "Credit Usage" : metric === "interactions" ? "Interactions" : "Unique Users"}`,
          data,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          fill: true,
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6,
        },
      ],
    })
  }

  useEffect(() => {
    loadData()
  }, [metric])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      x: {
        type: "category" as const,
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  }

  // Calculate summary stats
  const totalCount = usageItems.reduce((acc, item) => acc + (item.count || 0), 0)
  const avgCount = usageItems.length > 0 ? Math.round(totalCount / usageItems.length) : 0
  const peakCount = usageItems.length > 0 ? Math.max(...usageItems.map((i) => i.count || 0)) : 0

  // Calculate month-over-month change
  const midPoint = Math.floor(usageItems.length / 2)
  const firstHalf = usageItems.slice(0, midPoint).reduce((acc, item) => acc + (item.count || 0), 0)
  const secondHalf = usageItems.slice(midPoint).reduce((acc, item) => acc + (item.count || 0), 0)
  const monthChange = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0

  if (loading && !chartData) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[500px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Usage Analytics</h2>
          <p className="text-sm text-muted-foreground">Real-time credit usage data and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit_usage">Credit Usage</SelectItem>
              <SelectItem value="interactions">Interactions</SelectItem>
              <SelectItem value="unique_users">Unique Users</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {usesMockData && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Displaying sample data. Connect to API to see real usage analytics.
          </AlertDescription>
        </Alert>
      )}

      {error && !usesMockData && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-25 dark:from-blue-950 dark:to-blue-900 border-b border-blue-200 dark:border-blue-800">
          <CardTitle className="text-base font-semibold flex items-center justify-between text-blue-900 dark:text-blue-50">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {metric === "credit_usage" ? "Credit Usage" : metric === "interactions" ? "Interactions" : "Unique Users"}{" "}
              Over Time
            </span>
            <span className="text-xs font-normal text-blue-700 dark:text-blue-300">Last 30 days</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
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
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total {metric === "credit_usage" ? "Credits" : metric === "interactions" ? "Interactions" : "Users"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-2">{usageItems.length} data points</p>
              </div>
              <div
                className={`flex items-center gap-1 ${monthChange >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">{Math.abs(monthChange).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{avgCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-2">Daily average</p>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">8.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Peak Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{peakCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-2">Highest daily usage</p>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">5.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
