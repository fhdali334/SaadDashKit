"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface LineChartData {
  name: string
  value1: number
  value2: number
}

interface TailAdminSmoothLineChartProps {
  data: LineChartData[]
  title?: string
  height?: number
  showGrid?: boolean
}

export function TailAdminSmoothLineChart({
  data,
  title = "Line Chart 1",
  height = 350,
  showGrid = false,
}: TailAdminSmoothLineChartProps) {
  return (
    <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark px-6">
      {title && <div className="mb-6 px-0 text-xl font-semibold text-black dark:text-white">{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 14 }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 14 }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            cursor={{ stroke: "#e5e7eb" }}
          />
          <defs>
            <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value1"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#gradient1)"
            isAnimationActive={true}
          />
          <Area
            type="monotone"
            dataKey="value2"
            stroke="#93c5fd"
            strokeWidth={2}
            fill="url(#gradient2)"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
