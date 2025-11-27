"use client"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HexagonChartProps {
  title: string
  subtitle?: string
  data: Array<{
    name: string
    value1: number
    value2?: number
    value3?: number
  }>
  dataKey1: string
  dataKey2?: string
  dataKey3?: string
  color1?: string
  color2?: string
  color3?: string
  height?: number
  showLegend?: boolean
}

export function AdvancedHexagonChart({
  title,
  subtitle,
  data = [], // <-- default to empty array to avoid `.slice` on undefined
  dataKey1,
  dataKey2,
  dataKey3,
  color1 = "#10b981",
  color2 = "#3b82f6",
  color3 = "#f59e0b",
  height = 400,
  showLegend = true,
}: HexagonChartProps) {
  const radarData = data.slice(0, 6)

  if (radarData.length === 0) {
    return (
      <Card className="w-full h-full border border-border rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full h-full border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              angle={90}
              domain={[0, 360]}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <Radar
              name={dataKey1}
              dataKey={dataKey1}
              stroke={color1}
              fill={color1}
              fillOpacity={0.6}
              isAnimationActive={true}
            />
            {dataKey2 && (
              <Radar
                name={dataKey2}
                dataKey={dataKey2}
                stroke={color2}
                fill={color2}
                fillOpacity={0.4}
                isAnimationActive={true}
              />
            )}
            {dataKey3 && (
              <Radar
                name={dataKey3}
                dataKey={dataKey3}
                stroke={color3}
                fill={color3}
                fillOpacity={0.3}
                isAnimationActive={true}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            {showLegend && <Legend wrapperStyle={{ paddingTop: "20px" }} />}
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
