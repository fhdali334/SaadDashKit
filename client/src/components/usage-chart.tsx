"use client"

import { useEffect, useRef } from "react"
import type { UsageData } from "@shared/schema"

interface UsageChartProps {
  data: UsageData[]
  height?: number
}

declare global {
  interface Window {
    Chart: any
  }
}

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.12)"

export function UsageChart({ data, height = 300 }: UsageChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const isDark = document.documentElement.classList.contains("dark")
    const textColor = isDark ? "#94a3b8" : "#64748b"
    const gridColor = isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.1)"

    chartRef.current = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: "Total Requests",
            data: data.map((d) => d.totalRequests),
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
          {
            label: "Successful",
            data: data.map((d) => d.successfulRequests),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: "#10b981",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
          {
            label: "Failed",
            data: data.map((d) => d.failedRequests),
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              color: textColor,
              usePointStyle: true,
              pointStyle: "circle",
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#f8fafc",
            bodyColor: "#f8fafc",
            borderColor: "#334155",
            borderWidth: 1,
            padding: 12,
          },
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: gridColor,
              drawBorder: false,
            },
            ticks: {
              color: textColor,
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
              color: gridColor,
              drawBorder: false,
            },
            ticks: {
              color: textColor,
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
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={canvasRef} height={height} />
}
