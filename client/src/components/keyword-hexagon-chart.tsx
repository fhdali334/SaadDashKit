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
const TAILADMIN_EMERALD = "#10b981"

interface Keyword {
  id: string
  keyword: string
  frequency: number
  relevanceScore: number
  category?: string
}

interface KeywordHexagonChartProps {
  keywords?: Keyword[]
}

export function KeywordHexagonChart({ keywords = [] }: { keywords?: any[] }) {
  const topKeywords = (keywords ?? []).slice(0, 20)
  const radarData = topKeywords.slice(0, 6).map((kw) => ({
    name: kw.keyword,
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
          <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} />
            <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} angle={90} />
            <Radar
              name="Relevance %"
              dataKey="relevance"
              stroke={TAILADMIN_EMERALD}
              fill={TAILADMIN_EMERALD}
              fillOpacity={0.6}
            />
            <Radar
              name="Frequency %"
              dataKey="frequency"
              stroke={TAILADMIN_BLUE}
              fill={TAILADMIN_BLUE}
              fillOpacity={0.3}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
              formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 space-y-3 border-t border-border pt-6">
        <h4 className="text-sm font-semibold text-foreground mb-4">Top Keywords</h4>
        {topKeywords.slice(0, 8).map((kw) => (
          <div
            key={kw.id}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">{kw.keyword}</span>
                {kw.category && (
                  <Badge variant="outline" className="text-xs rounded-full">
                    {kw.category}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="whitespace-nowrap">Frequency: {kw.frequency}</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold" style={{ color: TAILADMIN_EMERALD }}>
                  {Math.round(kw.relevanceScore * 100)}%
                </span>
                <span className="text-muted-foreground">Relevance</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
