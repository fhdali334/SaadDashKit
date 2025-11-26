"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
const TAILADMIN_BLUE_GRADIENT_START = "rgba(70, 95, 255, 0.25)"
const TAILADMIN_BLUE_GRADIENT_END = "rgba(70, 95, 255, 0.01)"

interface TailAdminLineChartProps {
  title: string
  subtitle?: string
  labels: string[] | Date[]
  data: number[]
  dataLabel?: string
  height?: number
  useTimeScale?: boolean
  icon?: React.ReactNode
}

export function TailAdminLineChart({
  title,
  subtitle,
  labels,
  data,
  dataLabel = "Value",
  height = 400,
  useTimeScale = false,
  icon,
}: TailAdminLineChartProps) {
  const createGradient = (ctx: CanvasRenderingContext2D, chartArea: any) => {
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    gradient.addColorStop(0, TAILADMIN_BLUE_GRADIENT_START)
    gradient.addColorStop(1, TAILADMIN_BLUE_GRADIENT_END)
    return gradient
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: dataLabel,
        data,
        borderColor: TAILADMIN_BLUE,
        backgroundColor: (context: any) => {
          const { ctx, chartArea } = context.chart
          if (!chartArea) return TAILADMIN_BLUE_GRADIENT_START
          return createGradient(ctx, chartArea)
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: TAILADMIN_BLUE,
        pointBorderColor: "#fff",
        pointBorderWidth: 3,
        pointHoverBackgroundColor: TAILADMIN_BLUE,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 3,
      },
    ],
  }

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
        padding: 14,
        cornerRadius: 10,
        displayColors: false,
        titleFont: {
          size: 13,
          weight: "600" as const,
        },
        bodyFont: {
          size: 14,
          weight: "500" as const,
        },
        callbacks: {
          label: (context: any) => `${dataLabel}: ${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ...(useTimeScale
          ? {
              type: "time" as const,
              time: {
                unit: "day" as const,
              },
            }
          : {
              type: "category" as const,
            }),
        grid: {
          display: true,
          color: "rgba(148, 163, 184, 0.08)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 12,
            weight: "500" as const,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(148, 163, 184, 0.08)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 12,
            weight: "500" as const,
          },
          padding: 12,
        },
        border: {
          display: false,
        },
      },
    },
  }

  return (
    <Card className="border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(70, 95, 255, 0.08)" }}
              >
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div style={{ height: `${height}px` }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
}

interface MultiLineDataset {
  label: string
  data: number[]
  color?: string
}

interface TailAdminMultiLineChartProps {
  title: string
  subtitle?: string
  labels: string[] | Date[]
  datasets: MultiLineDataset[]
  height?: number
  useTimeScale?: boolean
  icon?: React.ReactNode
}

export function TailAdminMultiLineChart({
  title,
  subtitle,
  labels,
  datasets,
  height = 400,
  useTimeScale = false,
  icon,
}: TailAdminMultiLineChartProps) {
  const colors = [
    { border: TAILADMIN_BLUE, bg: "rgba(70, 95, 255, 0.15)" },
    { border: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
    { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
    { border: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  ]

  const chartData = {
    labels,
    datasets: datasets.map((ds, index) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || colors[index % colors.length].border,
      backgroundColor: ds.color ? `${ds.color}26` : colors[index % colors.length].bg,
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointBackgroundColor: ds.color || colors[index % colors.length].border,
      pointBorderColor: "#fff",
      pointBorderWidth: 3,
    })),
  }

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
        align: "end" as const,
        labels: {
          color: "#64748b",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: {
            size: 12,
            weight: "500" as const,
          },
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f8fafc",
        bodyColor: "#f8fafc",
        borderColor: "#334155",
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        ...(useTimeScale
          ? {
              type: "time" as const,
              time: {
                unit: "day" as const,
              },
            }
          : {
              type: "category" as const,
            }),
        grid: {
          display: true,
          color: "rgba(148, 163, 184, 0.08)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 12,
            weight: "500" as const,
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
          color: "rgba(148, 163, 184, 0.08)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 12,
            weight: "500" as const,
          },
          padding: 12,
        },
        border: {
          display: false,
        },
      },
    },
  }

  return (
    <Card className="border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(70, 95, 255, 0.08)" }}
              >
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div style={{ height: `${height}px` }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
}
