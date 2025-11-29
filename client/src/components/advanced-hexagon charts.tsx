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

const TAILADMIN_BLUE = "#3b82f6"
const TAILADMIN_PURPLE = "#8b5cf6"

interface Keyword {
  id: string
  keyword: string
  frequency: number
  relevanceScore: number
  category?: string
}

interface AdvancedHexagonChartProps {
  title?: string
  subtitle?: string
  keywords?: Keyword[]
  height?: number
  showLegend?: boolean
}

export function AdvancedHexagonChart({
  title,
  subtitle,
  keywords = [],
  height = 350,
  showLegend = true,
}: AdvancedHexagonChartProps) {
  const topKeywords = (keywords ?? []).slice(0, 6)

  const radarData = topKeywords.map((kw) => ({
    name: kw.keyword.length > 10 ? kw.keyword.slice(0, 10) + "..." : kw.keyword,
    frequency: kw.frequency,
    relevance: Math.round(kw.relevanceScore * 100),
  }))

  if (radarData.length === 0) {
    return <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Radar
            name="Relevance %"
            dataKey="relevance"
            stroke={TAILADMIN_PURPLE}
            fill={TAILADMIN_PURPLE}
            fillOpacity={0.5}
            isAnimationActive={true}
          />
          <Radar
            name="Frequency"
            dataKey="frequency"
            stroke={TAILADMIN_BLUE}
            fill={TAILADMIN_BLUE}
            fillOpacity={0.3}
            isAnimationActive={true}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              color: "hsl(var(--foreground))",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
