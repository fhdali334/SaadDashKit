import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    return (
      <Card className="border-border rounded-2xl">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-lg font-semibold">Keywords & Keyphrases</CardTitle>
          <CardDescription>Business-relevant terms and phrases identified by AI</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">No keywords available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-lg font-semibold">Keywords & Keyphrases</CardTitle>
        <CardDescription>Business-relevant terms and phrases identified by AI</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} />
              <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} angle={90} />
              <Radar name="Relevance %" dataKey="relevance" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Radar name="Frequency %" dataKey="frequency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 space-y-3 border-t border-border pt-6">
          <h4 className="text-sm font-semibold text-foreground mb-4">Top Keywords</h4>
          {topKeywords.slice(0, 8).map((kw) => (
            <div
              key={kw.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
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
                  <span className="text-emerald-500 font-semibold">{Math.round(kw.relevanceScore * 100)}%</span>
                  <span className="text-muted-foreground">Relevance</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
