"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface BarChartData {
  name: string
  value: number
}

interface TailAdminBarChartProps {
  data: BarChartData[]
  title?: string
  height?: number
  showGrid?: boolean
}

export function TailAdminBarChart({
  data,
  title = "Bar Chart 1",
  height = 350,
  showGrid = false,
}: TailAdminBarChartProps) {
  return (
    <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark px-6">
      {title && <div className="mb-6 px-0 text-xl font-semibold text-black dark:text-white">{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} isAnimationActive={true} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
