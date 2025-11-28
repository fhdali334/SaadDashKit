"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const TAILADMIN_BLUE = "#3b82f6"
const TAILADMIN_BLUE_LIGHT = "rgba(59, 130, 246, 0.15)"

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
  icon,
}: TailAdminLineChartProps) {
  const [scale, setScale] = useState(1)
  const chartRef = useRef<HTMLDivElement>(null)

  // Convert data to Recharts format
  const chartData = labels.map((label, idx) => ({
    name: typeof label === "string" ? label : label.toLocaleDateString(),
    value: data[idx],
  }))

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setScale((prev) => {
      const newScale = e.deltaY > 0 ? Math.max(1, prev - 0.1) : prev + 0.1
      return Math.min(newScale, 3)
    })
  }

  return (
    <Card className="border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.08)" }}
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
        <div
          ref={chartRef}
          onWheel={handleWheel}
          style={{
            height: `${height}px`,
            overflow: scale > 1 ? "auto" : "hidden",
            cursor: "grab",
          }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", transition: "transform 0.2s" }}>
            <ResponsiveContainer width={scale > 1 ? "100%" : "100%"} height={height}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TAILADMIN_BLUE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={TAILADMIN_BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#94a3b8" }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    color: "#f8fafc",
                  }}
                  labelStyle={{ color: "#f8fafc" }}
                  formatter={(value) => [value.toLocaleString(), dataLabel]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={TAILADMIN_BLUE}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
  icon,
}: TailAdminMultiLineChartProps) {
  const [scale, setScale] = useState(1)
  const chartRef = useRef<HTMLDivElement>(null)

  const colors = [
    { line: TAILADMIN_BLUE, fill: "rgba(59, 130, 246, 0.3)" },
    { line: "rgba(59, 130, 246, 0.6)", fill: "rgba(59, 130, 246, 0.1)" },
    { line: "#10b981", fill: "rgba(16, 185, 129, 0.15)" },
    { line: "#f59e0b", fill: "rgba(245, 158, 11, 0.15)" },
    { line: "#ef4444", fill: "rgba(239, 68, 68, 0.15)" },
  ]

  // Convert data to Recharts format
  const chartData = labels.map((label, idx) => ({
    name: typeof label === "string" ? label : label.toLocaleDateString(),
    ...datasets.reduce(
      (acc, ds) => {
        acc[ds.label] = ds.data[idx]
        return acc
      },
      {} as Record<string, number>,
    ),
  }))

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setScale((prev) => {
      const newScale = e.deltaY > 0 ? Math.max(1, prev - 0.1) : prev + 0.1
      return Math.min(newScale, 3)
    })
  }

  return (
    <Card className="border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.08)" }}
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
        <div
          ref={chartRef}
          onWheel={handleWheel}
          style={{
            height: `${height}px`,
            overflow: scale > 1 ? "auto" : "hidden",
            cursor: "grab",
          }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", transition: "transform 0.2s" }}>
            <ResponsiveContainer width={scale > 1 ? "100%" : "100%"} height={height}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {colors.map((_, idx) => (
                    <linearGradient key={`gradient-${idx}`} id={`colorGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[idx].line} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={colors[idx].line} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#94a3b8" }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    color: "#f8fafc",
                  }}
                  labelStyle={{ color: "#f8fafc" }}
                />
                {datasets.map((ds, idx) => (
                  <Area
                    key={ds.label}
                    type="monotone"
                    dataKey={ds.label}
                    stroke={ds.color || colors[idx % colors.length].line}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#colorGradient${idx})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
