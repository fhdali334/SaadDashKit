"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface TailAdminSemicircleChartProps {
  percentage?: number
  successRate?: number
  change?: number
  title?: string
  subtitle?: string
  height?: number
}

export function TailAdminSemicircleChart({
  percentage,
  successRate,
  change,
  title = "Monthly Target",
  subtitle = "Target you've set for each month",
  height = 300,
}: TailAdminSemicircleChartProps) {
  // Support both percentage and successRate props
  const rawValue = percentage ?? successRate ?? 0
  const parsedPercentage = Number.isFinite(rawValue) ? rawValue : Number(rawValue) || 0
  const safePercentage = Math.max(0, Math.min(100, parsedPercentage))

  const data = [
    { name: "filled", value: safePercentage },
    { name: "empty", value: 100 - safePercentage },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-6 shadow-sm">
      <div className="mb-8 px-0">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
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
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="relative -mt-16 text-center">
          <div className="text-4xl font-bold text-foreground">{safePercentage.toFixed(1)}%</div>
          {change !== undefined && (
            <div
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                change >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
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
