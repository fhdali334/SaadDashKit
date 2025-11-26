"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
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

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.12)"

function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  }
}

export function CostChart() {
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any>(null)
  const [error, setError] = useState("")

  const loadData = async () => {
    setLoading(true)
    setError("")

    const defaultRange = getDefaultDateRange()
    const params = new URLSearchParams()
    params.set("metric", "credit_usage")
    params.set("startTime", defaultRange.startTime)
    params.set("endTime", defaultRange.endTime)
    params.set("limit", "100")

    try {
      const res = await fetch(`/api/usage?${params.toString()}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Request failed")
      }

      const items = json.items || []

      const labels = items.map((i: any) => new Date(i.period))
      const data = items.map((i: any) => i.count || 0)

      setChartData({
        labels,
        datasets: [
          {
            label: "Credit Usage",
            data,
            borderColor: TAILADMIN_BLUE,
            backgroundColor: TAILADMIN_BLUE_LIGHT,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: TAILADMIN_BLUE,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      })
    } catch (e: any) {
      setError(e.message || String(e))
      console.error("Error loading chart data:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f8fafc",
        bodyColor: "#f8fafc",
        borderColor: "#334155",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day" as const,
        },
        grid: {
          display: true,
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 12,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 12,
          },
          padding: 10,
        },
        border: {
          display: false,
        },
      },
    },
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" style={{ color: TAILADMIN_BLUE }} />
          Usage Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p className="text-sm text-destructive">Failed to load usage data</p>
          </div>
        ) : !chartData ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>No usage data available yet</p>
          </div>
        ) : (
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
