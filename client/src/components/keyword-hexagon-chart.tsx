import { Badge } from "@/components/ui/badge"
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
const TAILADMIN_EMERALD = "#10b981"

interface Keyword {
  id: string
  keyword: string
  frequency: number
  relevanceScore: number
  category?: string
}

export function KeywordHexagonChart({ keywords = [] }: { keywords?: any[] }) {
  const topKeywords = (keywords ?? []).slice(0, 20)
  const radarData = topKeywords.slice(0, 6).map((kw) => ({
    name: kw.keyword.length > 12 ? kw.keyword.slice(0, 12) + "..." : kw.keyword,
    frequency: kw.frequency,
    relevance: Math.round(kw.relevanceScore * 100),
    fullName: kw.keyword,
  }))

  if (radarData.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No keywords available</div>
  }

  return (
    <div>
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" gridType="polygon" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 500 }} />
            <PolarRadiusAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              angle={90}
              domain={[0, 100]}
            />
            <Radar
              name="Relevance %"
              dataKey="relevance"
              stroke={TAILADMIN_PURPLE}
              fill={TAILADMIN_PURPLE}
              fillOpacity={0.5}
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={800}
            />
            <Radar
              name="Frequency"
              dataKey="frequency"
              stroke={TAILADMIN_BLUE}
              fill={TAILADMIN_BLUE}
              fillOpacity={0.25}
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={800}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                color: "hsl(var(--foreground))",
                padding: "12px 16px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: "hsl(var(--foreground))", fontSize: 12 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-2 border-t border-border pt-6">
        <h4 className="text-sm font-semibold text-foreground mb-4">Top Keywords</h4>
        {topKeywords.slice(0, 8).map((kw) => (
          <div
            key={kw.id}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground text-sm">{kw.keyword}</span>
                {kw.category && (
                  <Badge variant="outline" className="text-xs rounded-full border-border">
                    {kw.category}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">Freq: {kw.frequency}</span>
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                style={{ backgroundColor: `${TAILADMIN_PURPLE}15` }}
              >
                <span className="font-semibold" style={{ color: TAILADMIN_PURPLE }}>
                  {Math.round(kw.relevanceScore * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
