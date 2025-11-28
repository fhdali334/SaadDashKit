"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface TailAdminSemicircleChartProps {
  percentage: number
  change?: number
  title?: string
  subtitle?: string
  height?: number
}

export function TailAdminSemicircleChart({
  percentage = 0, // default to 0 to avoid undefined
  change,
  title = "Monthly Target",
  subtitle = "Target you've set for each month",
  height = 300,
}: TailAdminSemicircleChartProps) {
  // Coerce and clamp the percentage to a safe number (0..100)
  const parsedPercentage = Number.isFinite(percentage) ? percentage : Number(percentage) || 0
  const safePercentage = Math.max(0, Math.min(100, parsedPercentage))

  const data = [
    { name: "filled", value: safePercentage },
    { name: "empty", value: 100 - safePercentage },
  ]

  return (
    <div className="rounded-sm border border-stroke bg-white px-6 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="mb-8 px-0">
        <h3 className="text-xl font-semibold text-black dark:text-white">{title}</h3>
        <p className="text-sm text-bodydark">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#3b82f6" />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="relative -mt-16 text-center ">
          <div className="text-4xl font-bold text-black dark:text-white">{safePercentage.toFixed(2)}%</div>
          {change !== undefined && (
            <div
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                change >= 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
