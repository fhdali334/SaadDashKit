"use client"
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OverlappingComparisonChartProps {
  title: string
  subtitle?: string
  data: any[]
  bars: Array<{
    dataKey: string
    name: string
    color: string
    yAxisId?: string
  }>
  lines: Array<{
    dataKey: string
    name: string
    color: string
    yAxisId?: string
  }>
  height?: number
}

export function OverlappingComparisonChart({
  title,
  subtitle,
  data,
  bars = [],
  lines = [],
  height = 300,
}: OverlappingComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full border border-border rounded-3xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border border-border rounded-3xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            {/* Add explicitly named axes for each series */}
            <YAxis yAxisId="left" />
            {lines.length > 0 && <YAxis yAxisId="right" orientation="right" />}
            <Tooltip />
            <Legend />
            {bars.map((b) => (
              <Bar key={b.dataKey} dataKey={b.dataKey} fill={b.color} yAxisId={b.yAxisId ?? "left"} />
            ))}
            {lines.map((l) => (
              <Line
                key={l.dataKey}
                type="monotone"
                dataKey={l.dataKey}
                stroke={l.color}
                yAxisId={l.yAxisId ?? "right"}
                dot={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
