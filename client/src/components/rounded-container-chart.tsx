"use client"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RoundedContainerChartProps {
  title: string
  subtitle?: string
  data: any[]
  dataKey: string
  secondaryDataKey?: string
  type?: "bar" | "line"
  color1?: string
  color2?: string
  height?: number
  showGrid?: boolean
}

export function RoundedContainerChart({
  title,
  subtitle,
  data,
  dataKey,
  secondaryDataKey,
  type = "bar",
  color1 = "#3b82f6",
  color2 = "#10b981",
  height = 300,
  showGrid = true,
}: RoundedContainerChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full border border-border rounded-3xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const ChartComponent = type === "bar" ? BarChart : LineChart
  const DataComponent = type === "bar" ? Bar : Line

  return (
    <Card className="w-full border border-border rounded-3xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />}
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            {secondaryDataKey && <Legend />}
            <DataComponent
              dataKey={dataKey}
              fill={color1}
              stroke={color1}
              isAnimationActive={true}
              radius={type === "bar" ? [12, 12, 0, 0] : 0}
              dot={type === "line" ? { fill: color1, r: 4 } : false}
              activeDot={type === "line" ? { r: 6 } : { fill: "rgba(59, 130, 246, 0.8)" }}
            />
            {secondaryDataKey && (
              <DataComponent
                dataKey={secondaryDataKey}
                fill={color2}
                stroke={color2}
                isAnimationActive={true}
                radius={type === "bar" ? [12, 12, 0, 0] : 0}
                dot={type === "line" ? { fill: color2, r: 4 } : false}
                activeDot={type === "line" ? { r: 6 } : { fill: "rgba(16, 185, 129, 0.8)" }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
